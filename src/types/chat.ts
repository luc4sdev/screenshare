export interface ChatMessage {
    id: string;
    sender: string;    // Nome de quem enviou (ou 'Anfitrião')
    text: string;      // O conteúdo da mensagem
    time: string;      // Hora do envio (HH:MM)
    isHost: boolean;   // Para estilizar a mensagem do host diferente
}