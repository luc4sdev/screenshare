const nomes = [
    'Capivara', 'Camper', 'ProPlayer', 'Noob',
    'Prata', 'Global', 'Looter', 'Rushador',
    'Boludo', 'Sniper', 'Pombo', 'Troll'
];

const sufixos = [
    'Cego', 'Lagado', 'da AWP', 'da Panela',
    'de Miramar', 'Pino', 'Míope', 'da AK',
    'Tóxico', 'Tryhard', 'de Pochinki', 'Frio'
];

export function generateRandomName(): string {
    const nomeRandom = nomes[Math.floor(Math.random() * nomes.length)];
    const sufixoRandom = sufixos[Math.floor(Math.random() * sufixos.length)];

    const numero = Math.floor(Math.random() * 99) + 1;

    return `${nomeRandom} ${sufixoRandom} ${numero}`;
}