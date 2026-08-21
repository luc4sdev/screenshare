import { useEffect, useRef, useState } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import { Player } from './components/Player';
import { Link } from './components/Link';
import { Play } from './components/Play';
import { Error } from './components/Error';
import type { ChatMessage } from './types/chat';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { isChatMessage } from './utils/validateType';
import { generateRandomName } from './utils/nameGenerator';

export default function App() {
  const [shareLink, setShareLink] = useState<string>('');

  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPiP, setIsPiP] = useState(false);

  const [viewersCount, setViewersCount] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [spectatorConnToHost, setSpectatorConnToHost] = useState<DataConnection | null>(null);
  const [guestName] = useState<string>(() => generateRandomName());

  const isViewing = new URLSearchParams(window.location.search).has('room');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const CLIP_DURATION = 30;

  const createMessageObject = (text: string, senderName: string, isHost: boolean): ChatMessage => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sender: senderName,
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isHost,
  });

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    const params = new URLSearchParams(window.location.search);
    const hostId = params.get('room');

    if (hostId) {
      peer.on('open', () => {
        const conn = peer.connect(hostId);

        setSpectatorConnToHost(conn);

        conn.on('open', () => {
          conn.on('data', (data: unknown) => {
            if (isChatMessage(data)) {
              setMessages((prev) => [...prev, data]);
            }
          });
        });

        conn.on('close', () => {
          setError('A transmissão foi encerrada pelo anfitrião.');
        });
      });

      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
          setError('Transmissão não encontrada. O link é inválido ou já foi encerrado.');
        } else {
          setError('Ocorreu um erro de conexão.');
        }
      });

      peer.on('call', (call) => {
        call.answer();
        call.on('stream', (remoteStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play().catch(e => console.error("Error on player:", e));
          }
        });
      });
    } else {
      peer.on('connection', (conn) => {
        connectionsRef.current.push(conn);

        conn.on('open', () => {
          setViewersCount((prev) => prev + 1);

          conn.on('data', (data: unknown) => {
            if (isChatMessage(data)) {
              const receivedMsg = data;

              setMessages((prev) => [...prev, receivedMsg]);

              connectionsRef.current.forEach((otherConn) => {
                if (otherConn.peer !== conn.peer && otherConn.open) {
                  otherConn.send(receivedMsg);
                }
              });
            }
          });
        });

        conn.on('close', () => {
          setViewersCount((prev) => Math.max(0, prev - 1));
        });

        conn.on('error', () => {
          setViewersCount((prev) => Math.max(0, prev - 1));
        });

        if (streamRef.current) {
          peer.call(conn.peer, streamRef.current);
        }
      });
    }

    return () => {
      peer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!isViewing && shareLink && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [shareLink, isViewing]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleEnterPiP = () => setIsPiP(true);
    const handleLeavePiP = () => setIsPiP(false);

    videoElement.addEventListener('enterpictureinpicture', handleEnterPiP);
    videoElement.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      videoElement.removeEventListener('enterpictureinpicture', handleEnterPiP);
      videoElement.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [shareLink, isViewing]);

  const stopSharing = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {

      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    connectionsRef.current.forEach(conn => conn.close());
    connectionsRef.current = [];
    setViewersCount(0);

    setShareLink('');
  };

  const startSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;

      recordedChunksRef.current = [];

      const possibleTypes = [
        'video/mp4',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm'
      ];

      const mimeType = possibleTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);

          if (recordedChunksRef.current.length > CLIP_DURATION) {
            recordedChunksRef.current.shift();
          }
        }
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;

      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      setIsMuted(true);

      const myId = peerRef.current?.id;
      if (myId) {
        setShareLink(`${window.location.origin}?room=${myId}`);
      }
    } catch (err) {
      console.error("Erro ao compartilhar tela", err);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (videoRef.current) {
      videoRef.current.volume = newVolume;

      if (newVolume === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (videoRef.current.muted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Erro ao alternar tela cheia", err);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("Erro ao alternar PiP", err);
    }
  };

  const hostSendMessage = (text: string) => {
    const newMessage = createMessageObject(text, 'Anfitrião', true);

    setMessages((prev) => [...prev, newMessage]);

    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(newMessage);
      }
    });
  };

  const spectatorSendMessage = (text: string) => {
    const newMessage = createMessageObject(text, guestName, false);

    setMessages((prev) => [...prev, newMessage]);

    if (spectatorConnToHost && spectatorConnToHost.open) {
      spectatorConnToHost.send(newMessage);
    }
  };

  const downloadClip = () => {
    if (recordedChunksRef.current.length === 0) {
      alert("Ainda não há vídeo suficiente para clipar!");
      return;
    }

    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `clipe-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-12 px-4 font-sans text-gray-200 selection:bg-purple-500/30">
      <div className="w-full max-w-375 flex flex-col items-center">

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-10 text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-purple-600">
          {isViewing ? 'Assistindo Transmissão' : 'TDPP Lives'}
        </h1>

        {!isViewing && !shareLink && (
          <Play startSharing={startSharing} />
        )}

        {shareLink && (
          <Link
            shareLink={shareLink}
            viewersCount={viewersCount}
            stopSharing={stopSharing}
            downloadClip={downloadClip}
          />
        )}

        {error ? (
          <Error error={error} />
        ) : (shareLink || isViewing) && (
          <div className="mt-10 w-full grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,850px)_1fr] gap-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="hidden lg:block" />

            <div className="h-fit min-w-0">
              <Player
                videoRef={videoRef}
                containerRef={containerRef}
                isMuted={isMuted}
                volume={volume}
                isFullscreen={isFullscreen}
                isPiP={isPiP}
                toggleMute={toggleMute}
                handleVolumeChange={handleVolumeChange}
                toggleFullscreen={toggleFullscreen}
                togglePiP={togglePiP}
              />
            </div>
            <div className="w-full min-w-0 flex flex-col h-125 lg:h-auto bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-200">Chat da Live</h3>
              </div>

              <ChatMessages messages={messages} />
              <ChatInput
                onSendMessage={isViewing ? spectatorSendMessage : hostSendMessage}
                disabled={isViewing ? !spectatorConnToHost : shareLink === ''}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}