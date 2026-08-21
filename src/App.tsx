import { useEffect, useRef, useState } from 'react';
import Peer, { type DataConnection, type MediaConnection } from 'peerjs';
import { Player } from './components/Player';
import { Link } from './components/Link';
import { Play } from './components/Play';
import { Error } from './components/Error';
import type { ChatMessage } from './types/chat';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { isChatMessage } from './utils/validateType';
import { generateRandomName } from './utils/nameGenerator';
import { Bell, BellOff, Dices, User } from 'lucide-react';
import type { QualityOption } from './types/quality';
import { MicrophoneButton } from './components/MicrophoneButton';
import { VoiceParticipants } from './components/VoiceParticipants';
export default function App() {
  const [shareLink, setShareLink] = useState<string>('');

  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myMicStream, setMyMicStream] = useState<MediaStream | null>(null);
  const [remoteVoices, setRemoteVoices] = useState<{ stream: MediaStream; name: string; peerId: string }[]>([]);

  const myUsername = 'Anfitrião'
  const [isPiP, setIsPiP] = useState(false);

  const [viewersCount, setViewersCount] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [spectatorConnToHost, setSpectatorConnToHost] = useState<DataConnection | null>(null);
  const [isChatSoundEnabled, setIsChatSoundEnabled] = useState(true);


  const isViewing = new URLSearchParams(window.location.search).has('room');

  const [isNameSet, setIsNameSet] = useState<boolean>(!isViewing);
  const [guestName, setGuestName] = useState<string>('');

  const [tempName, setTempName] = useState<string>(() => generateRandomName());

  const [selectedQuality, setSelectedQuality] = useState<QualityOption>('720p');

  const qualitySettings = {
    '480p': {
      label: '480p (Leve)',
      desc: 'Ideal para muitos espectadores. Baixo uso de CPU.',
      video: { width: { ideal: 854, max: 854 }, height: { ideal: 480, max: 480 }, frameRate: { ideal: 30, max: 30 } }
    },
    '720p': {
      label: '720p (Padrão)',
      desc: 'Equilíbrio perfeito entre qualidade e performance.',
      video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } }
    },
    '1080p': {
      label: '1080p (Alta)',
      desc: 'Qualidade Full HD a 60FPS. Exige PC forte.',
      video: { width: { ideal: 1920, max: 1920 }, height: { ideal: 1080, max: 1080 }, frameRate: { ideal: 60, max: 60 } }
    },
    '1440p': {
      label: '1440p (2K)',
      desc: 'Qualidade QHD a 60FPS. Para monitores ultrawide ou 2K.',
      video: { width: { ideal: 2560, max: 2560 }, height: { ideal: 1440, max: 1440 }, frameRate: { ideal: 60, max: 60 } }
    },
    '2160p': {
      label: '4K (Extrema)',
      desc: 'Ultra HD a 60FPS. Apenas para PCs da NASA com muita internet.',
      video: { width: { ideal: 3840, max: 3840 }, height: { ideal: 2160, max: 2160 }, frameRate: { ideal: 60, max: 60 } }
    }
  };



  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const myMicStreamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const chatSoundRef = useRef(true);
  const CLIP_DURATION = 30;

  const toggleChatSound = () => {
    setIsChatSoundEnabled((prev) => {
      const newValue = !prev;
      chatSoundRef.current = newValue;
      return newValue;
    });
  };

  const createMessageObject = (text: string, senderName: string, isHost: boolean): ChatMessage => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sender: senderName,
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isHost,
  });

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log("Áudio bloqueado pelo navegador", err));
  };

  useEffect(() => {
    myMicStreamRef.current = myMicStream;
  }, [myMicStream]);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    const params = new URLSearchParams(window.location.search);
    const hostId = params.get('room');

    peer.on('call', (call) => {
      call.answer();

      let isVoiceCall = false;
      let currentStreamId: string | null = null;

      call.on('stream', (remoteStream) => {
        const hasVideo = remoteStream.getVideoTracks().length > 0;
        currentStreamId = remoteStream.id;

        if (hasVideo) {
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play().catch(e => console.error("Error on player:", e));
          }
        } else {
          isVoiceCall = true;
          const callerName = call.metadata?.userName || 'Desconhecido';

          setRemoteVoices((prev) => [...prev, {
            stream: remoteStream,
            name: callerName,
            peerId: call.peer
          }]);
        }
      });

      const removeVoice = () => {
        if (isVoiceCall && currentStreamId) {
          setRemoteVoices((prev) => prev.filter(v => v.stream.id !== currentStreamId));
          currentStreamId = null;
        }
      };
      call.on('close', removeVoice);

      if (call.peerConnection) {
        call.peerConnection.addEventListener('iceconnectionstatechange', () => {
          const state = call.peerConnection.iceConnectionState;
          if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            removeVoice();
          }
        });
      }
    });

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

    } else {
      peer.on('connection', (conn) => {
        connectionsRef.current.push(conn);

        conn.on('open', () => {
          setViewersCount((prev) => prev + 1);
          let isDisconnected = false;

          const handleDisconnect = () => {
            if (isDisconnected) return;
            isDisconnected = true;
            setViewersCount((prev) => Math.max(0, prev - 1));

            connectionsRef.current = connectionsRef.current.filter(
              (activeConn) => activeConn.peer !== conn.peer
            );
            setRemoteVoices((prev) => prev.filter(v => v.peerId !== conn.peer));
          };

          conn.on('close', handleDisconnect);
          conn.on('error', handleDisconnect);

          if (conn.peerConnection) {
            conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
              const state = conn.peerConnection.iceConnectionState;
              if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                handleDisconnect();
              }
            });
          }

          conn.on('data', (data: unknown) => {
            if (isChatMessage(data)) {
              if (!data.isHost && chatSoundRef.current) {
                playNotificationSound();
              }
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

        if (streamRef.current) {
          peer.call(conn.peer, streamRef.current);
        }

        if (myMicStreamRef.current) {
          peer.call(conn.peer, myMicStreamRef.current, {
            metadata: { userName: 'Anfitrião' }
          });
        }
      });
    }

    return () => {
      peer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!myMicStream || !peerRef.current) return;

    const activeAudioCalls: MediaConnection[] = [];

    const currentUserName = !isViewing ? myUsername : (guestName || 'Convidado');

    if (!isViewing) {
      connectionsRef.current.forEach((conn) => {
        if (conn.open) {
          const call = peerRef.current!.call(conn.peer, myMicStream, {
            metadata: { userName: currentUserName }
          });
          activeAudioCalls.push(call);
        }
      });
    } else {
      const params = new URLSearchParams(window.location.search);
      const hostId = params.get('room');

      if (hostId) {
        const call = peerRef.current!.call(hostId, myMicStream, {
          metadata: { userName: currentUserName }
        });
        activeAudioCalls.push(call);
      }
    }

    return () => {
      activeAudioCalls.forEach(call => call?.close());
    };
  }, [myMicStream, isViewing, guestName]);

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
      const videoConstraints = qualitySettings[selectedQuality].video;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
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

          if (recordedChunksRef.current.length > CLIP_DURATION + 1) {
            recordedChunksRef.current.splice(1, 1);
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

        <div className="relative mb-12 mt-4 text-center flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-purple-600/20 blur-[60px] pointer-events-none" />

          <div className="mb-6 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gray-900/80 border border-gray-800 shadow-sm backdrop-blur-sm z-10">
            {isViewing ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
            ) : (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
              </span>
            )}
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
              {isViewing ? 'Modo Espectador' : 'Transmissão P2P'}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-100 z-10">
            {isViewing ? 'Assistindo ' : 'TDPP '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-purple-600">
              {isViewing ? 'Transmissão' : 'Lives'}
            </span>
          </h1>

          <p className="mt-5 text-gray-400 font-medium text-sm md:text-base max-w-lg mx-auto z-10">
            {isViewing
              ? 'Conectado diretamente ao anfitrião.'
              : 'Compartilhe sua tela direto do navegador.'}
          </p>

        </div>

        {!isViewing && !shareLink && (
          <Play
            qualitySettings={qualitySettings}
            selectedQuality={selectedQuality}
            setSelectedQuality={setSelectedQuality}
            startSharing={startSharing}
          />
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

            <div className="w-full relative h-125 lg:h-full">
              <div className="absolute inset-0 flex flex-col bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="font-bold text-gray-200">Chat & Voz</h3>
                  <div className='flex items-center gap-3'>
                    <MicrophoneButton onMicChange={(stream) => setMyMicStream(stream)} />
                    {!isViewing && (
                      <button
                        onClick={toggleChatSound}
                        className="text-gray-400 hover:text-purple-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
                        title={isChatSoundEnabled ? "Silenciar notificações" : "Ativar notificações"}
                      >
                        {isChatSoundEnabled ? (
                          <Bell size={18} />
                        ) : (
                          <BellOff size={18} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {!isNameSet ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-950 overflow-y-auto min-h-0">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 mb-4">
                      <User size={32} />
                    </div>
                    <h4 className="text-gray-200 font-bold text-lg mb-1">Junte-se ao Chat</h4>
                    <p className="text-gray-400 text-sm text-center mb-6">
                      Como você quer ser chamado na transmissão?
                    </p>

                    <div className="w-full flex gap-2 mb-4">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Seu nome..."
                        maxLength={25}
                      />
                      <button
                        onClick={() => setTempName(generateRandomName())}
                        className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-purple-400 rounded-xl transition-colors active:scale-95"
                        title="Gerar outro nome aleatório"
                      >
                        <Dices size={20} />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (tempName.trim()) {
                          setGuestName(tempName.trim());
                          setIsNameSet(true);
                        }
                      }}
                      disabled={!tempName.trim()}
                      className="w-full cursor-pointer bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(147,51,234,0.2)] hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                    >
                      Entrar na Conversa
                    </button>
                  </div>

                ) : (
                  <>
                    <ChatMessages messages={messages} />
                    <ChatInput
                      onSendMessage={isViewing ? spectatorSendMessage : hostSendMessage}
                      disabled={isViewing ? !spectatorConnToHost : shareLink === ''}
                    />
                  </>

                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <VoiceParticipants
        myMicStream={myMicStream}
        remoteVoices={remoteVoices}
        myUsername={isViewing ? guestName : myUsername}
      />
    </div>
  );
}