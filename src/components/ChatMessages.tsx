import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/chat';

interface ChatMessagesProps {
    messages: ChatMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center bg-gray-950 rounded-t-2xl">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <p className="text-gray-500 text-sm">O chat começou.<br />Diga oi!</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto bg-gray-950 rounded-t-2xl scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isHost ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-xs font-semibold ${msg.isHost ? 'text-purple-400' : 'text-gray-400'}`}>
                            {msg.sender}
                        </span>
                        <span className="text-[10px] text-gray-600">{msg.time}</span>
                    </div>
                    <div className={`mt-1 px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${msg.isHost ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}