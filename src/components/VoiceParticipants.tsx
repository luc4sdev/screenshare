import { useEffect, useRef, useState } from "react";
import { User, Volume2, VolumeX } from "lucide-react";

interface AudioCardProps {
    stream: MediaStream;
    name: string;
    isLocal?: boolean;
}

function AudioCard({ stream, name, isLocal = false }: AudioCardProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        if (!stream || stream.getAudioTracks().length === 0) return;

        if (audioRef.current && !isLocal) {
            audioRef.current.srcObject = stream;
            audioRef.current.volume = 0.5;
        }

        try {
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkAudioLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                const average = sum / dataArray.length;

                setIsSpeaking(average > 4);

                animationRef.current = requestAnimationFrame(checkAudioLevel);
            };

            checkAudioLevel();

            return () => {
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
                audioContext.close().catch(console.error);
            };
        } catch (err) {
            console.error("Erro ao analisar áudio:", err);
        }
    }, [stream, isLocal]);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (audioRef.current) {
            audioRef.current.volume = val;
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 p-4 bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-lg w-full transition-all hover:bg-gray-800/80">

            <div
                className={`relative p-1 rounded-full transition-all duration-200 ${isSpeaking
                    ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110'
                    : 'bg-gray-700 scale-100'
                    }`}
            >
                <div className="bg-gray-900 p-3 rounded-full flex items-center justify-center">
                    <User size={28} className={isSpeaking ? 'text-white' : 'text-gray-400'} />
                </div>
            </div>

            <span className="text-sm font-bold text-gray-200 truncate w-full text-center mt-1">
                {name}
            </span>

            {!isLocal && (
                <div className="flex items-center gap-2 w-full mt-2 bg-gray-950 p-2 rounded-lg border border-gray-800">
                    {volume === 0 ? (
                        <VolumeX size={14} className="text-red-400 shrink-0" />
                    ) : (
                        <Volume2 size={14} className="text-gray-400 shrink-0" />
                    )}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        style={{
                            background: `linear-gradient(to right, #a855f7 ${volume * 100}%, #374151 ${volume * 100}%)`
                        }}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none 
    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full
    [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
                    />
                </div>
            )}

            {!isLocal && <audio ref={audioRef} autoPlay playsInline hidden />}
        </div>
    );
}

interface VoiceParticipantsProps {
    myMicStream: MediaStream | null;
    remoteVoices: { stream: MediaStream; name: string; peerId?: string }[];
    myUsername: string;
}

export function VoiceParticipants({ myMicStream, remoteVoices, myUsername }: VoiceParticipantsProps) {
    if (!myMicStream && remoteVoices.length === 0) return null;

    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 w-40 max-h-[80vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700 z-50">

            {myMicStream && (
                <AudioCard stream={myMicStream} name={myUsername} isLocal={true} />
            )}

            {remoteVoices.map((item, index) => (
                <AudioCard
                    key={item.stream.id || index}
                    stream={item.stream}
                    name={item.name}
                />
            ))}

        </div>
    );
}