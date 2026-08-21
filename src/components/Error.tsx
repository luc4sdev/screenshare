import { CircleX } from "lucide-react";

interface ErrorProps {
    error: string;
}

export function Error({ error }: ErrorProps) {
    return (
        <div className="mt-10 w-full max-w-2xl bg-gray-900 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-gray-800 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
                <CircleX size={30} />
            </div>
            <h2 className="text-2xl font-bold text-gray-200">Ops!</h2>
            <p className="text-gray-400">{error}</p>

            <a href="/" className="mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all duration-300">
                Voltar ao Início
            </a>
        </div>
    )
}