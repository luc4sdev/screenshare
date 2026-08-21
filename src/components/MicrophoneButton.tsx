import { Mic, MicOff } from "lucide-react";
import { useState, useRef } from "react";

interface MicrophoneButtonProps {
    onMicChange: (stream: MediaStream | null) => void;
}

export function MicrophoneButton({ onMicChange }: MicrophoneButtonProps) {
    const [isMuted, setIsMuted] = useState(true);
    const streamRef = useRef<MediaStream | null>(null);

    const toggleMic = async () => {
        try {
            if (isMuted) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                streamRef.current = stream;
                onMicChange(stream);
                setIsMuted(false);
            } else {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                onMicChange(null);
                setIsMuted(true);
            }
        } catch (err) {
            console.error("Erro ao acessar microfone:", err);
            alert("Para falar na transmissão, permita o acesso ao microfone no topo do navegador!");
        }
    };

    return (
        <button
            onClick={toggleMic}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${isMuted
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                }`}
            title={isMuted ? "Ativar Microfone" : "Desativar Microfone"}
        >
            {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
        </button>
    );
}