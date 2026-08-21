import { Square } from "lucide-react";
import { useState } from "react";
import { ViewerBadge } from "./ViewerBadge";

interface LinkProps {
    shareLink: string;
    viewersCount: number;
    stopSharing: () => void;
}

export function Link({ shareLink, viewersCount, stopSharing }: LinkProps) {
    const [copied, setCopied] = useState(false);


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

    return (
        <div className="mt-4 w-full max-w-2xl bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800 text-center flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex justify-between items-center">
                <div className="flex items-center justify-start gap-3">
                    <p className="text-gray-400 font-medium text-sm uppercase tracking-wider">
                        Transmissão iniciada
                    </p>
                    <ViewerBadge count={viewersCount} />
                </div>
                <button
                    onClick={stopSharing}
                    className="text-xs font-bold cursor-pointer bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                ><Square size={18} />
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
    )
}