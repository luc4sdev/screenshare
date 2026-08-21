import { useEffect, useRef } from "react";

function AudioTrack({ stream }: { stream: MediaStream }) {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current && stream) {
            audioRef.current.srcObject = stream;
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay playsInline hidden />;
}


interface RemoteAudioPlayersProps {
    voiceStreams: MediaStream[];
}

export function RemoteAudioPlayers({ voiceStreams }: RemoteAudioPlayersProps) {
    return (
        <div className="hidden" aria-hidden="true">
            {voiceStreams.map((stream, index) => (
                <AudioTrack key={stream.id || index} stream={stream} />
            ))}
        </div>
    );
}