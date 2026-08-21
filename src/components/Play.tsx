import { MonitorPlay, Settings2 } from "lucide-react";
import type { QualityOption } from "../types/quality";

interface PlayProps {
    qualitySettings: Record<QualityOption, { label: string; desc: string; video: MediaTrackConstraints }>;
    selectedQuality: QualityOption;
    setSelectedQuality: (quality: QualityOption) => void;
    startSharing: () => void;
}
export function Play({ qualitySettings, selectedQuality, setSelectedQuality, startSharing }: PlayProps) {
    return (
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 mt-20">
            <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 shadow-xl max-w-md w-full">
                <div className="flex items-center gap-3 mb-6">
                    <Settings2 className="text-purple-400" size={24} />
                    <h2 className="text-xl font-bold text-gray-200">Qualidade da Transmissão</h2>
                </div>

                <div className="flex flex-col gap-3">
                    {(Object.keys(qualitySettings) as QualityOption[]).map((key) => {
                        const isSelected = selectedQuality === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedQuality(key)}
                                className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 active:scale-95 ${isSelected
                                    ? 'bg-purple-600/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                    : 'bg-gray-950 border-gray-800 hover:border-gray-600 hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <span className={`font-bold ${isSelected ? 'text-purple-400' : 'text-gray-300'}`}>
                                        {qualitySettings[key].label}
                                    </span>
                                    {isSelected && (
                                        <span className="flex h-2.5 w-2.5 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 mt-1">
                                    {qualitySettings[key].desc}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
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