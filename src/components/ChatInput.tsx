import { useState } from 'react';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && !disabled) {
            onSendMessage(text.trim());
            setText('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-800 bg-gray-900 rounded-b-2xl">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={disabled ? "Conectando ao chat..." : "Digite sua mensagem..."}
                disabled={disabled}
                className="flex-1 bg-gray-950 border border-gray-800 text-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all"
            />
            <button
                type="submit"
                disabled={disabled || !text.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-5 py-2.5 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
        </form>
    );
}