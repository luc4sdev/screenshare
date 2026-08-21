import { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface MicrophoneButtonProps {
    myMicStream: MediaStream | null;
    onMicChange: (stream: MediaStream) => void;
}

export function MicrophoneButton({ myMicStream, onMicChange }: MicrophoneButtonProps) {
    const audioTrack = myMicStream?.getAudioTracks()[0];
    const isMuted = audioTrack ? !audioTrack.enabled : true;

    const [, setForceUpdate] = useState(0);

    const toggleMic = async () => {
        if (myMicStream) {
            const currentTrack = myMicStream.getAudioTracks()[0];
            if (currentTrack) {
                currentTrack.enabled = !currentTrack.enabled;
                setForceUpdate((prev) => prev + 1);
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: false }
                });
                onMicChange(stream);
            } catch (err) {
                console.error("Erro ao acessar o microfone", err);
            }
        }
    };

    return (
        <button
            onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center border
        ${isMuted
                    ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                    : 'bg-purple-500 text-white border-purple-400 hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                }`}
            title={isMuted ? "Ligar Microfone" : "Mutar Microfone"}
        >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
    );
}