let gameState = {
    cards: [],
    slot: [],
    score: 0,
    currentLevel: 1,
    undoCount: 3,
    shuffleCount: 2,
    history: [],
    elapsedTime: 0,
    timerInterval: null,
    isPaused: false
};

function initGame(level) {
    stopTimer();
    
    gameState = {
        cards: [],
        slot: [],
        score: 0,
        currentLevel: level || 1,
        undoCount: 3,
        shuffleCount: 2,
        history: [],
        elapsedTime: 0,
        timerInterval: null,
        isPaused: false
    };
    
    document.getElementById('currentLevel').textContent = gameState.currentLevel;
    document.getElementById('score').textContent = '0';
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('undoCount').textContent = '3';
    document.getElementById('shuffleCount').textContent = '2';
    
    document.getElementById('undoBtn').disabled = true;
    document.getElementById('shuffleBtn').disabled = true;
    document.getElementById('winModal').style.display = 'none';
    document.getElementById('loseModal').style.display = 'none';
    
    setTimeout(() => {
        gameState.cards = generateCards(gameState.currentLevel);
        renderCards();
        renderSlot();
        startTimer();
        
        document.getElementById('undoBtn').disabled = false;
        document.getElementById('shuffleBtn').disabled = false;
    }, 300);
}

function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.elapsedTime++;
            document.getElementById('timer').textContent = formatTime(gameState.elapsedTime);
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function saveHistory() {
    gameState.history.push({
        cards: JSON.parse(JSON.stringify(gameState.cards)),
        slot: [...gameState.slot],
        score: gameState.score
    });
    
    if (gameState.history.length > 10) {
        gameState.history.shift();
    }
}

function renderCards() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    if (!gameState.cards || gameState.cards.length === 0) return;
    
    const sortedCards = [...gameState.cards].sort((a, b) => a.layer - b.layer);
    
    sortedCards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card' + (card.isCovered ? ' covered' : '');
        cardEl.textContent = card.type;
        cardEl.style.left = card.x + 'px';
        cardEl.style.top = card.y + 'px';
        cardEl.style.zIndex = card.layer + 1;
        cardEl.dataset.id = card.id;
        
        if (!card.isCovered) {
            cardEl.addEventListener('click', () => handleCardClick(card.id));
        }
        
        gameBoard.appendChild(cardEl);
    });
}

function renderSlot() {
    const slotCards = document.getElementById('slotCards');
    slotCards.innerHTML = '';
    
    if (!gameState.slot) return;
    
    gameState.slot.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'slot-card';
        cardEl.textContent = card.type;
        slotCards.appendChild(cardEl);
    });
}

function handleCardClick(cardId) {
    const cardIndex = gameState.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    
    const card = gameState.cards[cardIndex];
    if (card.isCovered) return;
    
    saveHistory();
    
    gameState.cards.splice(cardIndex, 1);
    gameState.slot.push(card);
    gameState.score += 10;
    
    document.getElementById('score').textContent = gameState.score;
    
    gameState.cards = checkCover(gameState.cards);
    
    renderCards();
    renderSlot();
    
    checkMatch();
    checkGameEnd();
}

function checkMatch() {
    const typeCounts = {};
    gameState.slot.forEach(card => {
        typeCounts[card.type] = (typeCounts[card.type] || 0) + 1;
    });
    
    const typesToRemove = Object.keys(typeCounts).filter(type => typeCounts[type] >= 3);
    
    if (typesToRemove.length > 0) {
        typesToRemove.forEach(type => {
            let removed = 0;
            gameState.slot = gameState.slot.filter(card => {
                if (card.type === type && removed < 3) {
                    removed++;
                    return false;
                }
                return true;
            });
        });
        
        gameState.score += 100;
        document.getElementById('score').textContent = gameState.score;
        renderSlot();
    }
}

function checkGameEnd() {
    if (gameState.cards.length === 0 && gameState.slot.length === 0) {
        stopTimer();
        gameState.isPaused = true;
        
        document.getElementById('winScore').textContent = gameState.score;
        document.getElementById('winTime').textContent = formatTime(gameState.elapsedTime);
        document.getElementById('winModal').style.display = 'flex';
        return;
    }
    
    if (gameState.slot.length > 7) {
        stopTimer();
        gameState.isPaused = true;
        document.getElementById('loseModal').style.display = 'flex';
    }
}

function undo() {
    if (gameState.undoCount <= 0 || gameState.history.length === 0) return;
    
    const lastState = gameState.history.pop();
    gameState.cards = lastState.cards;
    gameState.slot = lastState.slot;
    gameState.score = lastState.score;
    gameState.undoCount--;
    
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('undoCount').textContent = gameState.undoCount;
    
    if (gameState.undoCount <= 0) {
        document.getElementById('undoBtn').disabled = true;
    }
    
    renderCards();
    renderSlot();
}

function shuffle() {
    if (gameState.shuffleCount <= 0) return;
    
    saveHistory();
    
    const positions = gameState.cards.map(card => ({ x: card.x, y: card.y }));
    const shuffledPositions = shuffleArray(positions);
    
    gameState.cards = gameState.cards.map((card, index) => ({
        ...card,
        x: shuffledPositions[index].x,
        y: shuffledPositions[index].y
    }));
    
    gameState.cards = checkCover(gameState.cards);
    gameState.shuffleCount--;
    
    document.getElementById('shuffleCount').textContent = gameState.shuffleCount;
    
    if (gameState.shuffleCount <= 0) {
        document.getElementById('shuffleBtn').disabled = true;
    }
    
    renderCards();
}

function restartGame() {
    initGame(gameState.currentLevel);
}

function nextLevel() {
    const nextLevel = Math.min(gameState.currentLevel + 1, 4);
    initGame(nextLevel);
}

document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('shuffleBtn').addEventListener('click', shuffle);
document.getElementById('restartBtn').addEventListener('click', restartGame);

document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        initGame(parseInt(btn.dataset.level));
    });
});

window.addEventListener('DOMContentLoaded', () => {
    initGame(1);
});
