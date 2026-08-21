interface ViewerBadgeProps {
    count: number;
}

export function ViewerBadge({ count }: ViewerBadgeProps) {
    return (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full animate-in fade-in zoom-in duration-300">
            <div className="relative flex h-2.5 w-2.5">
                {count > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </div>
            <span className="text-red-400 font-bold text-sm tracking-wide">
                {count === 0 ? 'Ao Vivo' : `${count} assistindo`}
            </span>
        </div>
    );
}