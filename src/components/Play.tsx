import { MonitorPlay } from "lucide-react";

interface PlayProps {
    startSharing: () => void;
}
export function Play({ startSharing }: PlayProps) {
    return (
        <div className="flex-1 flex items-center justify-center mt-20">
            <button
                onClick={startSharing}
                className="group relative flex items-center gap-3 cursor-pointer bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950"
            >
                <MonitorPlay />
                Compartilhar Tela
            </button>
        </div>
    )
}