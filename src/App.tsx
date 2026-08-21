import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

export default function App() {
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isViewing = new URLSearchParams(window.location.search).has('room');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    const params = new URLSearchParams(window.location.search);
    const hostId = params.get('room');

    if (hostId) {
      peer.on('open', () => {
        peer.connect(hostId);
      });

      peer.on('call', (call) => {
        call.answer();
        call.on('stream', (remoteStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play().catch(e => console.error("Erro no play:", e));
          }
        });
      });
    } else {
      peer.on('connection', (conn) => {
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

  const stopSharing = () => {
    if (streamRef.current) {

      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

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

  const copyToClipboard = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar link', err);
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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-12 px-4 font-sans text-gray-200 selection:bg-purple-500/30">
      <div className="w-full max-w-5xl flex flex-col items-center">

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-10 text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-purple-600">
          {isViewing ? 'Assistindo Transmissão' : 'TDPP Transmissões'}
        </h1>

        {!isViewing && !shareLink && (
          <div className="flex-1 flex items-center justify-center mt-20">
            <button
              onClick={startSharing}
              className="group relative flex items-center gap-3 cursor-pointer bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Compartilhar Tela
            </button>
          </div>
        )}

        {shareLink && (
          <div className="mt-4 w-full max-w-2xl bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800 text-center flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex justify-between items-center">
              <p className="text-gray-400 font-medium text-sm uppercase tracking-wider">
                Transmissão iniciada
              </p>

              <button
                onClick={stopSharing}
                className="text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                Encerrar
              </button>
            </div>

            <button
              onClick={copyToClipboard}
              className="group flex items-center justify-between w-full bg-gray-950 p-4 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all duration-200 overflow-hidden"
            >
              <span className="text-purple-300 font-mono text-left truncate mr-4">
                {shareLink}
              </span>
              <div className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${copied ? 'bg-green-500/20 text-green-400' : 'bg-purple-600 text-white group-hover:bg-purple-500'}`}>
                {copied ? 'Copiado!' : 'Copiar'}
              </div>
            </button>
          </div>
        )}

        {(shareLink || isViewing) && (
          <div
            ref={containerRef}
            className="mt-10 w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10 relative group animate-in fade-in zoom-in-95 duration-500"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-contain"
            />

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-end gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                  title={isMuted ? "Ativar som" : "Desativar som"}
                >
                  {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{
                    background: `linear-gradient(to right, #a855f7 ${(isMuted ? 0 : volume) * 100}%, #4b5563 ${(isMuted ? 0 : volume) * 100}%)`
                  }}
                  className="w-20 md:w-28 h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full
                    [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
                  title="Ajustar volume"
                />
              </div>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Tela Cheia"
              >
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}