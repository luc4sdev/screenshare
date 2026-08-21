import { Maximize, Minimize, Volume2, VolumeX } from "lucide-react";

interface PlayerProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    isMuted: boolean;
    volume: number;
    isFullscreen: boolean;
    isPiP: boolean;
    toggleMute: () => void;
    handleVolumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    toggleFullscreen: () => void;
    togglePiP: () => void;
}
export function Player({
    videoRef,
    containerRef,
    isMuted,
    volume,
    isFullscreen,
    isPiP,
    toggleMute,
    handleVolumeChange,
    toggleFullscreen,
    togglePiP
}: PlayerProps) {
    return (
        <div
            ref={containerRef}
            className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10 relative group animate-in fade-in zoom-in-95 duration-500"
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
            />

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/90 via-black/50 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMute}
                        className="text-white hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                        title={isMuted ? "Ativar som" : "Desativar som"}
                    >
                        {isMuted ? (
                            <VolumeX />
                        ) : (
                            <Volume2 />
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

                <div className="flex items-center gap-1">
                    {document.pictureInPictureEnabled && (
                        <button
                            onClick={togglePiP}
                            className={`transition-colors p-2 rounded-lg hover:bg-white/10 ${isPiP ? 'text-purple-400' : 'text-white hover:text-purple-400'}`}
                            title={isPiP ? "Sair do modo flutuante" : "Vídeo Flutuante (PiP)"}
                        >
                            {isPiP ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="12" y="12" width="7" height="5" rx="1" ry="1"></rect><line x1="16" y1="16" x2="16" y2="16"></line></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="12" y="12" width="7" height="5" rx="1" ry="1"></rect></svg>
                            )}
                        </button>
                    )}

                    <button
                        onClick={toggleFullscreen}
                        className="text-white hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                        title="Tela Cheia"
                    >
                        {isFullscreen ? (
                            <Minimize />
                        ) : (
                            <Maximize />
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}