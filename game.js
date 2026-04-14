const DOG_EMOJIS = [
    '🐕', '🐶', '🐩', '🦮', '🐕‍🦺', '', '🐈‍⬛', '🦁', '🐯', '🐆',
    '🐴', '🦄', '🦓', '🦌', '🐮', '🐷', '🐖', '🐗', '', '🐑',
    '🐐', '🐪', '🐫', '🦙', '🦒', '🐘'
];

const levelConfig = [
    { types: 3, cardsPerType: 6, layers: 2, layerOffset: 10 },
    { types: 5, cardsPerType: 6, layers: 3, layerOffset: 12 },
    { types: 7, cardsPerType: 9, layers: 4, layerOffset: 15 },
    { types: 12, cardsPerType: 15, layers: 8, layerOffset: 20 }
];

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function generateCards(level) {
    const config = levelConfig[level - 1];
    const iconPool = DOG_EMOJIS.slice(0, config.types);
    const cards = [];
    
    for (let i = 0; i < config.types; i++) {
        for (let j = 0; j < config.cardsPerType; j++) {
            cards.push({
                id: `card-${level}-${i}-${j}-${Math.random().toString(36).substr(2, 9)}`,
                type: iconPool[i],
                x: 0,
                y: 0,
                layer: 0,
                isCovered: false
            });
        }
    }
    
    let shuffledCards = shuffleArray(cards);
    
    shuffledCards = shuffledCards.map((card, index) => ({
        ...card,
        layer: index % config.layers
    }));
    
    const cardWidth = 55;
    const cardHeight = 65;
    const boardWidth = 380;
    const boardHeight = 380;
    const cardsPerRow = 5;
    
    const layerCards = {};
    for (let layer = 0; layer < config.layers; layer++) {
        layerCards[layer] = shuffledCards.filter(card => card.layer === layer);
    }
    
    const positionedCards = [];
    for (let layer = 0; layer < config.layers; layer++) {
        const cardsInLayer = layerCards[layer];
        const offsetX = layer * config.layerOffset;
        const offsetY = layer * config.layerOffset;
        
        cardsInLayer.forEach((card, index) => {
            const row = Math.floor(index / cardsPerRow);
            const col = index % cardsPerRow;
            card.x = offsetX + col * (cardWidth + 10) + 15;
            card.y = offsetY + row * (cardHeight + 10) + 15;
            card.layer = layer;
            positionedCards.push(card);
        });
    }
    
    return checkCover(positionedCards);
}

function checkOverlap(cardA, cardB) {
    const cardWidth = 55;
    const cardHeight = 65;
    
    const aLeft = cardA.x;
    const aRight = cardA.x + cardWidth;
    const aTop = cardA.y;
    const aBottom = cardA.y + cardHeight;
    
    const bLeft = cardB.x;
    const bRight = cardB.x + cardWidth;
    const bTop = cardB.y;
    const bBottom = cardB.y + cardHeight;
    
    return !(aRight <= bLeft || aLeft >= bRight || aBottom <= bTop || aTop >= bBottom);
}

function checkCover(cards) {
    cards.forEach(card => {
        card.isCovered = false;
    });

    cards.forEach((cardA, indexA) => {
        cards.forEach((cardB, indexB) => {
            if (indexA === indexB) return;
            
            const isOverlapping = checkOverlap(cardA, cardB);
            const isAbove = cardB.layer > cardA.layer;
            
            if (isOverlapping && isAbove) {
                cardA.isCovered = true;
            }
        });
    });

    return cards;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
