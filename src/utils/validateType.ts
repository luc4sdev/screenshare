import type { ChatMessage } from "../types/chat";

export function isChatMessage(data: unknown): data is ChatMessage {
    return (
        typeof data === 'object' &&
        data !== null &&
        'id' in data &&
        'sender' in data &&
        'text' in data &&
        'time' in data &&
        'isHost' in data
    );
}