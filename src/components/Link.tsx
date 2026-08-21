import { Download, Square, Copy, Check, Radio } from "lucide-react";
import { useState } from "react";
import { ViewerBadge } from "./ViewerBadge";

interface LinkProps {
    shareLink: string;
    viewersCount: number;
    stopSharing: () => void;
    downloadClip: () => void;
}

export function Link({ shareLink, viewersCount, stopSharing, downloadClip }: LinkProps) {
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
        <div className="mt-4 w-full max-w-2xl bg-gray-900/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl shadow-2xl border border-gray-800 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">

            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">

                <div className="flex items-center justify-start gap-3">
                    <div className="flex items-center gap-2 text-gray-400 font-medium text-sm uppercase tracking-wider">
                        <Radio size={16} className="text-purple-400 animate-pulse" />
                        <span className="hidden sm:inline">Transmissão Ativa</span>
                        <span className="sm:hidden">Ao Vivo</span>
                    </div>
                    <ViewerBadge count={viewersCount} />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={downloadClip}
                        className="flex-1 sm:flex-none justify-center text-sm font-bold cursor-pointer bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                        title="Salvar replay dos últimos 30 segundos"
                    >
                        <Download size={16} strokeWidth={2.5} />
                        <span className="whitespace-nowrap">Clipar 30s</span>
                    </button>
                    <button
                        onClick={stopSharing}
                        className="flex-1 sm:flex-none justify-center text-sm font-bold cursor-pointer bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                        <Square size={14} fill="currentColor" />
                        Encerrar
                    </button>
                </div>
            </div>

            <div className="relative group z-10">
                <div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>

                <div className="relative flex items-center justify-between w-full bg-gray-950 p-1.5 pl-4 rounded-xl border border-gray-800">
                    <span className="text-purple-300/90 font-mono text-sm sm:text-base text-left truncate mr-4 select-all">
                        {shareLink}
                    </span>

                    <button
                        onClick={copyToClipboard}
                        className={`shrink-0 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 active:scale-95 ${copied
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-purple-600 text-white hover:bg-purple-500 shadow-md hover:shadow-purple-500/25 border border-transparent'
                            }`}
                    >
                        {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
                        <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar Link'}</span>
                    </button>
                </div>
            </div>

        </div>
    );
}