const names = [
    'Camper', 'ProPlayer', 'Noob',
    'Prata', 'Global', 'Rushador',
    'Boludo', 'Sniper', 'Troll',
    'Zé Casinha', 'Zé Lootinho', 'Bot', 'Smurf',
    'Cone', 'Mochila', 'Bagre', 'Rato',
    'Xitado', 'Flasheado', 'Pescador', 'Paraquedista',
    'AFK', 'Tiltado',
];

const suffix = [
    'Cego', 'Lagado', 'da AWP', 'da Panela',
    'de Miramar', 'Pino', 'Míope', 'da AK',
    'Tóxico', 'Tryhard', 'de Pochinki', 'Frio',
    'do Rush B', 'da Red Zone', 'do Gás', 'da Dust 2',
    'da C4', 'Cego de Flash', 'Atropelado pelo Buggy',
    'sem Colete', 'Pescador de Pixel',
    'sem Robux', 'do Blox Fruits', 'sem Fone', 'Tiltado',
    'Carregado', 'Mutado', 'Ping 999', 'do Teclado RGB'
];

export function generateRandomName(): string {
    const nomeRandom = names[Math.floor(Math.random() * names.length)];
    const sufixoRandom = suffix[Math.floor(Math.random() * suffix.length)];

    const numero = Math.floor(Math.random() * 99) + 1;

    return `${nomeRandom} ${sufixoRandom} ${numero}`;
}