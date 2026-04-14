const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

let gameState = {};
let systemInfo = wx.getSystemInfoSync();

canvas.width = systemInfo.windowWidth;
canvas.height = systemInfo.windowHeight;

const DOG_EMOJIS = [
  '🐕',
  '🐶',
  '🐩',
  '🦮',
  '🐕‍🦺',
  '🐾',
  '🦴',
  '🎾',
  '🏆',
  '⭐',
  '🥎',
  '🎯'
];

const levelConfig = [
  { types: 3, cardsPerType: 6, layers: 2, layerOffset: 15 },
  { types: 5, cardsPerType: 9, layers: 3, layerOffset: 18 },
  { types: 7, cardsPerType: 9, layers: 4, layerOffset: 22 },
  { types: 10, cardsPerType: 9, layers: 6, layerOffset: 28 },
];

const LEVELS = [
  { id: 1, name: '新手试炼', difficulty: 'easy', description: '让你觉得你很行～', cardTypes: DOG_EMOJIS.slice(0, 3), cardCount: 18 },
  { id: 2, name: '初露锋芒', difficulty: 'easy', description: '难度逐渐增加', cardTypes: DOG_EMOJIS.slice(0, 5), cardCount: 45 },
  { id: 3, name: '极限挑战', difficulty: 'hard', description: '开始有挑战了！', cardTypes: DOG_EMOJIS.slice(0, 7), cardCount: 63 },
  { id: 4, name: '狗王挑战', difficulty: 'hard', description: '终极挑战！通关率<10%', cardTypes: DOG_EMOJIS.slice(0, 10), cardCount: 90 },
];

const STATS_KEY = 'dog_game_stats';
const SHARE_KEY = 'dog_game_shared';
const LEVEL_PROGRESS_KEY = 'dog_game_level_progress';
const SETTINGS_KEY = 'dog_game_settings';

const DEFAULT_STATS = {
  highScore: 0,
  totalWins: 0,
  longestWinStreak: 0,
  currentWinStreak: 0,
};

const DEFAULT_LEVEL_PROGRESS = {
  maxUnlockedLevel: 1,
  completedLevels: [],
  bestTimes: {},
};

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  musicEnabled: true,
};

function getSettings() {
  try {
    const saved = wx.getStorageSync(SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to get settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  try {
    wx.setStorageSync(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

function toggleSound() {
  const settings = getSettings();
  settings.soundEnabled = !settings.soundEnabled;
  saveSettings(settings);
  return settings;
}

function toggleMusic() {
  const settings = getSettings();
  settings.musicEnabled = !settings.musicEnabled;
  saveSettings(settings);
  return settings;
}

function getGameStats() {
  try {
    const saved = wx.getStorageSync(STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to get game stats:', e);
  }
  return { ...DEFAULT_STATS };
}

function saveGameStats(stats) {
  try {
    wx.setStorageSync(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save game stats:', e);
  }
}

function getLevelProgress() {
  try {
    const saved = wx.getStorageSync(LEVEL_PROGRESS_KEY);
    if (saved) {
      const progress = JSON.parse(saved);
      
      if (progress.maxUnlockedLevel > 4) {
        progress.maxUnlockedLevel = 4;
      }
      
      progress.completedLevels = progress.completedLevels.filter(l => l <= 4);
      
      const newBestTimes = {};
      for (const key in progress.bestTimes) {
        const level = parseInt(key);
        if (level <= 4) {
          newBestTimes[level] = progress.bestTimes[key];
        }
      }
      progress.bestTimes = newBestTimes;
      
      return progress;
    }
  } catch (e) {
    console.error('Failed to get level progress:', e);
  }
  return { ...DEFAULT_LEVEL_PROGRESS };
}

function saveLevelProgress(progress) {
  try {
    wx.setStorageSync(LEVEL_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save level progress:', e);
  }
}

function completeLevel(level, timeInSeconds) {
  const progress = getLevelProgress();
  
  if (!progress.completedLevels.includes(level)) {
    progress.completedLevels.push(level);
  }
  
  if (level >= progress.maxUnlockedLevel) {
    progress.maxUnlockedLevel = Math.min(level + 1, 4);
  }
  
  if (timeInSeconds !== undefined) {
    const currentBest = progress.bestTimes[level];
    if (currentBest === undefined || timeInSeconds < currentBest) {
      progress.bestTimes[level] = timeInSeconds;
    }
  }
  
  saveLevelProgress(progress);
  return progress;
}

function getBestTime(level) {
  const progress = getLevelProgress();
  return progress.bestTimes[level];
}

function isLevelUnlocked(level) {
  const progress = getLevelProgress();
  return level <= progress.maxUnlockedLevel;
}

function isLevelCompleted(level) {
  const progress = getLevelProgress();
  return progress.completedLevels.includes(level);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function generateId(len = 6) {
  const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let res = '';
  while (len > 0) {
    res += pool[Math.floor(pool.length * Math.random())];
    len--;
  }
  return res;
}

function fastShuffle(arr) {
  const res = arr.slice();
  for (let i = 0; i < res.length; i++) {
    const idx = Math.floor(Math.random() * res.length);
    [res[i], res[idx]] = [res[idx], res[i]];
  }
  return res;
}

function generateCards(level) {
  const cards = [];
  const config = levelConfig[Math.min(level - 1, levelConfig.length - 1)];
  const iconPool = DOG_EMOJIS.slice(0, config.types);

  const allCards = [];
  for (const type of iconPool) {
    for (let i = 0; i < config.cardsPerType; i++) {
      allCards.push({ type, emoji: type });
    }
  }

  const shuffledCards = fastShuffle(allCards);
  const layerCards = [];

  if (level === 4) {
    const typeIndices = {};
    iconPool.forEach(type => {
      typeIndices[type] = [];
    });

    shuffledCards.forEach((card, index) => {
      typeIndices[card.type].push(index);
    });

    const layerAssignments = new Array(shuffledCards.length).fill(0);

    iconPool.forEach(type => {
      const indices = typeIndices[type];
      for (let i = 0; i < indices.length; i++) {
        layerAssignments[indices[i]] = i % config.layers;
      }
    });

    for (let i = layerAssignments.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      if (shuffledCards[i].type !== shuffledCards[j].type) {
        [layerAssignments[i], layerAssignments[j]] = [layerAssignments[j], layerAssignments[i]];
      }
    }

    for (let layer = 0; layer < config.layers; layer++) {
      layerCards[layer] = [];
    }
    shuffledCards.forEach((card, index) => {
      const layer = layerAssignments[index];
      layerCards[layer].push(card);
    });
  } else {
    for (let layer = 0; layer < config.layers; layer++) {
      const start = Math.floor((layer / config.layers) * shuffledCards.length);
      const end = Math.floor(((layer + 1) / config.layers) * shuffledCards.length);
      layerCards.push(shuffledCards.slice(start, end));
    }
  }

  let zIndex = 0;
  const centerX = 180;
  const centerY = 200;

  for (let layer = 0; layer < config.layers; layer++) {
    const layerData = layerCards[layer];
    const layerOffset = layer * config.layerOffset;
    const cardsInLayer = layerData.length;

    const cols = Math.ceil(Math.sqrt(cardsInLayer * 1.5));
    const rows = Math.ceil(cardsInLayer / cols);

    const cellWidth = 70;
    const cellHeight = 70;

    const startX = centerX - (cols * cellWidth) / 2 + layerOffset;
    const startY = centerY - (rows * cellHeight) / 2 + layerOffset;

    for (let i = 0; i < layerData.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const randomOffsetX = (Math.random() - 0.5) * 20;
      const randomOffsetY = (Math.random() - 0.5) * 20;

      cards.push({
        id: generateId(6),
        type: layerData[i].type,
        emoji: layerData[i].emoji,
        x: startX + col * cellWidth + randomOffsetX,
        y: startY + row * cellHeight + randomOffsetY,
        width: 70,
        height: 70,
        zIndex: zIndex++,
        isCover: false,
        status: 0
      });
    }
  }

  return checkCover(cards);
}

function checkCover(cards) {
  const updateCards = cards.slice();
  const cardWidth = 90;
  const cardHeight = 90;

  for (let i = 0; i < updateCards.length; i++) {
    const cur = updateCards[i];
    cur.isCover = false;

    if (cur.status !== 0) continue;

    const x1 = cur.x;
    const y1 = cur.y;
    const x2 = x1 + cardWidth;
    const y2 = y1 + cardHeight;

    for (let j = 0; j < updateCards.length; j++) {
      if (i === j) continue;

      const compare = updateCards[j];
      if (compare.status !== 0) continue;

      if (compare.zIndex <= cur.zIndex) continue;

      const x = compare.x;
      const y = compare.y;

      if (!(y + cardHeight <= y1 || y >= y2 || x + cardWidth <= x1 || x >= x2)) {
        cur.isCover = true;
        break;
      }
    }
  }

  return updateCards;
}

function washCards(level, cards) {
  const updateCards = cards.filter(c => c.status === 0);
  const eliminatedCards = cards.filter(c => c.status === 2);

  const shuffled = fastShuffle(updateCards);

  const config = levelConfig[Math.min(level - 1, levelConfig.length - 1)];
  const centerX = 180;
  const centerY = 200;

  const cols = Math.ceil(Math.sqrt(shuffled.length * 1.5));
  const rows = Math.ceil(shuffled.length / cols);

  const cellWidth = 70;
  const cellHeight = 70;

  const startX = centerX - (cols * cellWidth) / 2;
  const startY = centerY - (rows * cellHeight) / 2;

  let zIndex = 0;
  shuffled.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const randomOffsetX = (Math.random() - 0.5) * 20;
    const randomOffsetY = (Math.random() - 0.5) * 20;

    card.x = startX + col * cellWidth + randomOffsetX;
    card.y = startY + row * cellHeight + randomOffsetY;
    card.zIndex = zIndex++;
    card.isCover = false;
  });

  return checkCover([...shuffled, ...eliminatedCards]);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function initApp() {
  const gameStats = getGameStats();
  const levelProgress = getLevelProgress();
  const settings = getSettings();

  gameState = {
    currentTab: 0,
    gameStats,
    levelProgress,
    settings,
    currentPage: 'game',
    showStartScreen: true,
    gamePaused: false,
    showLoseModal: false,
    showWinModal: false,
    showLockedModal: false,
    showGameStatsModal: false,
    showGameGuideModal: false,
    showSettingsModal: false,
    lockedLevel: null,
    selectedLevel: 1,
    currentLevel: 1,
    cards: [],
    queue: [],
    score: 0,
    elapsedTime: 0,
    undoCount: 2,
    shuffleCount: 2,
    failCount: 0,
    hasShared: false,
    history: []
  };

  try {
    const shared = wx.getStorageSync(SHARE_KEY);
    if (shared) {
      gameState.hasShared = true;
    }
  } catch (e) {
    console.error('检查分享状态失败:', e);
  }

  render();
}

function initGame(level = 1) {
  const cards = checkCover(generateCards(level));
  const gameStats = getGameStats();

  gameState.cards = cards;
  gameState.queue = [];
  gameState.score = 0;
  gameState.elapsedTime = 0;
  gameState.undoCount = 2;
  gameState.shuffleCount = 2;
  gameState.failCount = 0;
  gameState.hasShared = false;
  gameState.gamePaused = false;
  gameState.showStartScreen = true;
  gameState.showLoseModal = false;
  gameState.showWinModal = false;
  gameState.gameStats = gameStats;
  gameState.history = [];
  gameState.currentLevel = level;

  try {
    const shared = wx.getStorageSync(SHARE_KEY);
    if (shared) {
      gameState.hasShared = true;
    }
  } catch (e) {
    console.error('检查分享状态失败:', e);
  }

  render();
}

function startGame(lvl = 1) {
  if (gameState.timer) {
    clearInterval(gameState.timer);
  }

  const newCards = checkCover(generateCards(lvl));
  const gameStats = getGameStats();

  gameState.cards = newCards;
  gameState.queue = [];
  gameState.score = 0;
  gameState.currentLevel = lvl;
  gameState.showStartScreen = false;
  gameState.showLoseModal = false;
  gameState.showWinModal = false;
  gameState.undoCount = 2;
  gameState.shuffleCount = 2;
  gameState.elapsedTime = 0;
  gameState.failCount = 0;
  gameState.hasShared = false;
  gameState.gameStats = gameStats;
  gameState.history = [];

  try {
    wx.removeStorageSync(SHARE_KEY);
  } catch (e) {
    console.error('清除分享状态失败:', e);
  }

  gameState.timer = setInterval(() => {
    if (!gameState.gamePaused && !gameState.showLoseModal && !gameState.showWinModal && !gameState.showStartScreen) {
      gameState.elapsedTime++;
      render();
    }
  }, 1000);

  render();
}

function handleCardClick(card) {
  if (gameState.gamePaused || gameState.showLoseModal || gameState.showWinModal) return;
  
  const cardIndex = gameState.cards.findIndex(c => c.id === card.id);
  if (cardIndex === -1) return;
  
  const targetCard = gameState.cards[cardIndex];
  if (targetCard.isCover || targetCard.status !== 0) return;

  gameState.history.push({
    cards: JSON.parse(JSON.stringify(gameState.cards)),
    queue: JSON.parse(JSON.stringify(gameState.queue)),
    score: gameState.score
  });

  if (gameState.history.length > 10) {
    gameState.history.shift();
  }

  const updateScene = gameState.cards.slice();
  const symbol = updateScene.find(c => c.id === card.id);
  symbol.status = 1;

  let updateQueue = gameState.queue.slice();
  updateQueue.push(symbol);

  let newScore = gameState.score + 10;
  const checkedCards = checkCover(updateScene);
  gameState.cards = checkedCards;
  gameState.queue = updateQueue;
  gameState.score = newScore;

  const typeCounts = {};
  updateQueue.forEach(card => {
    typeCounts[card.type] = (typeCounts[card.type] || 0) + 1;
  });

  const typesToRemove = Object.keys(typeCounts).filter(type => typeCounts[type] >= 3);

  if (typesToRemove.length > 0) {
    typesToRemove.forEach(type => {
      let removed = 0;
      updateQueue = updateQueue.filter(card => {
        if (card.type === type && removed < 3) {
          removed++;
          const find = updateScene.find(i => i.id === card.id);
          if (find) {
            find.status = 2;
          }
          return false;
        }
        return true;
      });
    });

    newScore += 100 * typesToRemove.length;
    gameState.score = newScore;
  }

  gameState.queue = updateQueue;
  const finalCheckedCards = checkCover(updateScene);
  gameState.cards = finalCheckedCards;

  if (updateQueue.length === 7) {
    gameState.showLoseModal = true;
    if (gameState.timer) {
      clearInterval(gameState.timer);
    }
  }

  const winCheck = !finalCheckedCards.find(s => s.status !== 2);
  if (winCheck) {
    gameState.showWinModal = true;
    
    completeLevel(gameState.currentLevel, gameState.elapsedTime);
    
    const newStats = { ...gameState.gameStats };
    newStats.highScore = Math.max(newStats.highScore, newScore);
    newStats.totalWins += 1;
    newStats.currentWinStreak += 1;
    newStats.longestWinStreak = Math.max(newStats.longestWinStreak, newStats.currentWinStreak);
    saveGameStats(newStats);
    gameState.gameStats = newStats;
    
    if (gameState.timer) {
      clearInterval(gameState.timer);
    }
  }

  render();
}

function handleUndo() {
  if (gameState.gamePaused || gameState.history.length === 0 || gameState.undoCount <= 0) return;
  const lastState = gameState.history.pop();
  gameState.cards = lastState.cards;
  gameState.queue = lastState.queue;
  gameState.score = lastState.score;
  gameState.undoCount--;
  render();
}

function handleShuffle() {
  if (gameState.gamePaused || gameState.shuffleCount <= 0) return;
  const washedCards = washCards(gameState.currentLevel, gameState.cards);
  gameState.cards = washedCards;
  gameState.shuffleCount--;
  render();
}

function handleRestart() {
  const needShare = gameState.failCount >= 1 && !gameState.hasShared;
  if (needShare) {
    wx.showToast({
      title: '请先分享到微信群！',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  startGame(gameState.currentLevel);
}

function handleLoseConfirm() {
  const needShare = gameState.failCount >= 1 && !gameState.hasShared;
  if (needShare) {
    wx.showToast({
      title: '请先分享到微信群！',
      icon: 'none',
      duration: 2000
    });
    return;
  }

  const newFailCount = gameState.failCount + 1;
  gameState.failCount = newFailCount;

  if (gameState.hasShared) {
    try {
      wx.removeStorageSync(SHARE_KEY);
      gameState.hasShared = false;
    } catch (e) {
      console.error('清除分享状态失败:', e);
    }
  }

  const newStats = { ...gameState.gameStats };
  newStats.currentWinStreak = 0;
  saveGameStats(newStats);
  gameState.gameStats = newStats;

  startGame(gameState.currentLevel);
  gameState.failCount = newFailCount;
}

function handleNextLevel() {
  if (gameState.currentLevel >= 4) {
    startGame(1);
  } else {
    startGame(gameState.currentLevel + 1);
  }
}

function handleLevelClick(level) {
  if (!isLevelUnlocked(level.id)) {
    gameState.lockedLevel = level;
    gameState.showLockedModal = true;
    render();
    return;
  }
  gameState.selectedLevel = level.id;
  gameState.currentLevel = level.id;
  gameState.currentTab = 0;
  initGame(level.id);
}

function getDifficultyText(difficulty) {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };
  return map[difficulty] || difficulty;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FEF3E2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.currentTab === 0) {
    renderGameTab();
  } else if (gameState.currentTab === 1) {
    renderLevelTab();
  } else if (gameState.currentTab === 2) {
    renderMineTab();
  }

  renderTabBar();
}

function renderGameTab() {
  if (gameState.showStartScreen) {
    renderStartScreen();
    return;
  }

  renderGameScreen();
}

function renderStartScreen() {
  ctx.fillStyle = '#FF9A3C';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐕', canvas.width / 2, 80);
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('狗了个狗', canvas.width / 2, 120);

  const stats = [
    { value: gameState.gameStats.highScore, label: '最高分', x: canvas.width / 2 - 100 },
    { value: gameState.gameStats.totalWins, label: '通关次数', x: canvas.width / 2 },
    { value: gameState.gameStats.longestWinStreak, label: '最长连胜', x: canvas.width / 2 + 100 }
  ];

  stats.forEach(stat => {
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, stat.x - 40, 145, 80, 70, 10);
    ctx.fill();
    ctx.strokeStyle = '#FF9A3C';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FF9A3C';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(stat.value), stat.x, 175);
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(stat.label, stat.x, 195);
  });

  ctx.fillStyle = '#6B5B4F';
  ctx.font = '16px Arial, sans-serif';
  ctx.textAlign = 'left';
  const descY = 250;
  ctx.fillText('1️⃣ 点击未被遮挡的卡牌', 40, descY);
  ctx.fillText('2️⃣ 凑齐3张相同的就能消除', 40, descY + 30);
  ctx.fillText('3️⃣ 卡槽满了就输了哦～', 40, descY + 60);

  ctx.textAlign = 'center';
  ctx.fillText('🔄 每局有2次洗牌机会', canvas.width / 2, descY + 100);
  ctx.fillText('↩️ 每局有2次撤回机会', canvas.width / 2, descY + 125);

  const btnX = canvas.width / 2 - 100;
  const btnY = descY + 155;
  ctx.fillStyle = '#FF9A3C';
  ctx.strokeStyle = '#E88932';
  ctx.lineWidth = 2;
  roundRect(ctx, btnX, btnY, 200, 50, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText('🎮 开始游戏', canvas.width / 2, btnY + 30);

  gameState.startBtn = { x: btnX, y: btnY, width: 200, height: 50 };
}

function renderGameScreen() {
  renderHeader();
  renderCards();
  renderSlot();
  renderControls();

  if (gameState.gamePaused) {
    renderPauseModal();
  }
  if (gameState.showLoseModal) {
    renderLoseModal();
  }
  if (gameState.showWinModal) {
    renderWinModal();
  }
}

function renderHeader() {
  ctx.fillStyle = '#FF9A3C';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐕 狗了个狗 🐕', canvas.width / 2, 25);

  const pauseBtnX = canvas.width - 50;
  ctx.fillStyle = '#FF9A3C';
  ctx.strokeStyle = '#E88932';
  ctx.lineWidth = 2;
  roundRect(ctx, pauseBtnX - 25, 10, 40, 35, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(gameState.gamePaused ? '▶️' : '⏸️', pauseBtnX - 5, 32);

  gameState.pauseBtn = { x: pauseBtnX - 25, y: 10, width: 40, height: 35 };

  const stats = [
    { label: '关卡', value: `${gameState.currentLevel}/4`, x: 40 },
    { label: '剩余', value: String(gameState.cards.filter(c => c.status === 0).length), x: canvas.width / 2 - 40 },
    { label: '得分', value: String(gameState.score), x: canvas.width / 2 + 60 },
    { label: '用时', value: formatTime(gameState.elapsedTime), x: canvas.width - 60 }
  ];

  ctx.fillStyle = '#6B5B4F';
  ctx.font = '12px Arial, sans-serif';
  stats.forEach(stat => {
    ctx.textAlign = 'center';
    ctx.fillText(stat.label, stat.x, 55);
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(stat.value, stat.x, 75);
    ctx.font = '12px Arial, sans-serif';
  });
}

function renderCards() {
  gameState.cards
    .filter(c => c.status === 0)
    .sort((a, b) => a.zIndex - b.zIndex)
    .forEach(card => {
      ctx.save();

      ctx.fillStyle = card.isCover ? 'rgba(0,0,0,0.1)' : '#FFFFFF';
      ctx.strokeStyle = card.isCover ? '#CCC' : '#FF9A3C';
      ctx.lineWidth = 2;

      roundRect(ctx, card.x, card.y, card.width, card.height, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = '36px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = card.isCover ? 0.6 : 1;
      ctx.fillText(card.emoji, card.x + card.width / 2, card.y + card.height / 2);

      ctx.restore();
    });
}

function renderSlot() {
  const slotY = canvas.height - 200;
  const slotWidth = 70;
  const slotHeight = 90;

  ctx.fillStyle = '#FFF5E6';
  ctx.strokeStyle = '#FFB86C';
  ctx.lineWidth = 2;

  for (let i = 0; i < 7; i++) {
    const x = 20 + i * (slotWidth + 5);
    roundRect(ctx, x, slotY, slotWidth, slotHeight, 10);
    ctx.fill();
    ctx.stroke();
  }

  gameState.queue.forEach((card, i) => {
    const x = 20 + i * (slotWidth + 5);
    ctx.font = '36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.emoji, x + slotWidth / 2, slotY + slotHeight / 2);
  });
}

function renderControls() {
  const btnY = canvas.height - 85;
  const btnWidth = (canvas.width - 80) / 3;

  const buttons = [
    { text: `↩️ 撤回 (${gameState.undoCount})`, x: 20, action: 'undo', disabled: gameState.undoCount <= 0 },
    { text: `🔄 洗牌 (${gameState.shuffleCount})`, x: 30 + btnWidth, action: 'shuffle', disabled: gameState.shuffleCount <= 0 },
    { text: '🎯 重新开始', x: 40 + btnWidth * 2, action: 'restart', disabled: false }
  ];

  gameState.controlButtons = [];

  buttons.forEach(btn => {
    ctx.fillStyle = btn.disabled ? '#CCCCCC' : '#FF9A3C';
    ctx.strokeStyle = btn.disabled ? '#AAAAAA' : '#E88932';
    ctx.lineWidth = 2;
    roundRect(ctx, btn.x, btnY, btnWidth, 45, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btnWidth / 2, btnY + 22);

    gameState.controlButtons.push({ ...btn, y: btnY, width: btnWidth, height: 45 });
  });
}

function renderPauseModal() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const modalX = canvas.width / 2 - 140;
  const modalY = canvas.height / 2 - 100;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF9A3C';
  ctx.lineWidth = 3;
  roundRect(ctx, modalX, modalY, 280, 150, 15);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⏸️ 游戏暂停', canvas.width / 2, modalY + 50);

  const btn1X = canvas.width / 2 - 100;
  const btn1Y = modalY + 80;
  ctx.fillStyle = '#FF9A3C';
  ctx.strokeStyle = '#E88932';
  ctx.lineWidth = 2;
  roundRect(ctx, btn1X, btn1Y, 200, 45, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText('▶️ 继续游戏', canvas.width / 2, btn1Y + 27);

  gameState.pauseContinueBtn = { x: btn1X, y: btn1Y, width: 200, height: 45 };
}

function renderLoseModal() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const modalX = canvas.width / 2 - 140;
  const modalY = canvas.height / 2 - 140;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF6B6B';
  ctx.lineWidth = 3;
  roundRect(ctx, modalX, modalY, 280, 280, 15);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('😢 游戏结束', canvas.width / 2, modalY + 50);

  ctx.font = '16px Arial, sans-serif';
  ctx.fillText('卡槽满了，再试一次吧！', canvas.width / 2, modalY + 80);

  const needShare = gameState.failCount >= 1 && !gameState.hasShared;

  if (needShare) {
    const shareBtnX = canvas.width / 2 - 100;
    const shareBtnY = modalY + 110;
    ctx.fillStyle = '#FF9A3C';
    ctx.strokeStyle = '#E88932';
    ctx.lineWidth = 2;
    roundRect(ctx, shareBtnX, shareBtnY, 200, 45, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('📤 分享到微信群', canvas.width / 2, shareBtnY + 27);

    gameState.loseShareBtn = { x: shareBtnX, y: shareBtnY, width: 200, height: 45 };

    const homeBtnX = canvas.width / 2 - 100;
    const homeBtnY = modalY + 165;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FF9A3C';
    ctx.lineWidth = 2;
    roundRect(ctx, homeBtnX, homeBtnY, 200, 45, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FF9A3C';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('🏠 返回首页', canvas.width / 2, homeBtnY + 27);

    gameState.loseHomeBtn = { x: homeBtnX, y: homeBtnY, width: 200, height: 45 };
  } else {
    const restartBtnX = canvas.width / 2 - 100;
    const restartBtnY = modalY + 110;
    ctx.fillStyle = '#FF9A3C';
    ctx.strokeStyle = '#E88932';
    ctx.lineWidth = 2;
    roundRect(ctx, restartBtnX, restartBtnY, 200, 45, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('🔄 重新开始', canvas.width / 2, restartBtnY + 27);

    gameState.loseRestartBtn = { x: restartBtnX, y: restartBtnY, width: 200, height: 45 };

    const homeBtnX = canvas.width / 2 - 100;
    const homeBtnY = modalY + 165;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FF9A3C';
    ctx.lineWidth = 2;
    roundRect(ctx, homeBtnX, homeBtnY, 200, 45, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FF9A3C';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('🏠 返回首页', canvas.width / 2, homeBtnY + 27);

    gameState.loseHomeBtn = { x: homeBtnX, y: homeBtnY, width: 200, height: 45 };
  }
}

function renderWinModal() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const modalX = canvas.width / 2 - 140;
  const modalY = canvas.height / 2 - 150;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF9A3C';
  ctx.lineWidth = 3;
  roundRect(ctx, modalX, modalY, 280, 300, 15);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 恭喜过关！', canvas.width / 2, modalY + 50);

  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('本次用时', canvas.width / 2 - 70, modalY + 85);
  ctx.fillText('得分', canvas.width / 2 + 70, modalY + 85);

  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText(formatTime(gameState.elapsedTime), canvas.width / 2 - 70, modalY + 110);
  ctx.fillText(String(gameState.score), canvas.width / 2 + 70, modalY + 110);

  ctx.font = '14px Arial, sans-serif';
  if (gameState.currentLevel >= 4) {
    ctx.fillText('你太厉害了！已通关所有关卡！', canvas.width / 2, modalY + 150);
  } else {
    ctx.fillText(`准备好挑战第 ${gameState.currentLevel + 1} 关了吗？`, canvas.width / 2, modalY + 150);
  }

  const nextBtnX = canvas.width / 2 - 100;
  const nextBtnY = modalY + 175;
  ctx.fillStyle = '#FF9A3C';
  ctx.strokeStyle = '#E88932';
  ctx.lineWidth = 2;
  roundRect(ctx, nextBtnX, nextBtnY, 200, 45, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial, sans-serif';
  if (gameState.currentLevel >= 4) {
    ctx.fillText('🔄 再玩一次', canvas.width / 2, nextBtnY + 27);
  } else {
    ctx.fillText('➡️ 下一关', canvas.width / 2, nextBtnY + 27);
  }

  gameState.winNextBtn = { x: nextBtnX, y: nextBtnY, width: 200, height: 45 };

  const homeBtnX = canvas.width / 2 - 100;
  const homeBtnY = modalY + 230;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF9A3C';
  ctx.lineWidth = 2;
  roundRect(ctx, homeBtnX, homeBtnY, 200, 45, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FF9A3C';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('🏠 返回首页', canvas.width / 2, homeBtnY + 27);

  gameState.winHomeBtn = { x: homeBtnX, y: homeBtnY, width: 200, height: 45 };
}

function renderLevelTab() {
  const levelProgress = getLevelProgress();
  gameState.levelProgress = levelProgress;

  ctx.fillStyle = '#FF9A3C';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎮 关卡选择', canvas.width / 2, 40);

  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = '#6B5B4F';
  ctx.fillText(`挑战关卡进度：${levelProgress.completedLevels.length} / 4`, canvas.width / 2, 65);

  let y = 85;
  LEVELS.forEach(level => {
    const unlocked = isLevelUnlocked(level.id);
    const completed = isLevelCompleted(level.id);
    
    const cardX = 20;
    const cardY = y;
    const cardWidth = canvas.width - 40;
    const cardHeight = 140;

    ctx.fillStyle = unlocked ? '#FFFFFF' : '#E5E5E5';
    ctx.strokeStyle = completed ? '#4CAF50' : (unlocked ? '#FF9A3C' : '#CCCCCC');
    ctx.lineWidth = 3;
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillStyle = '#6B5B4F';
    
    const levelIcon = completed ? '✅' : (unlocked ? '🎯' : '🔒');
    ctx.fillText(`${levelIcon} ${level.name}`, cardX + 20, cardY + 35);

    ctx.font = '14px Arial, sans-serif';
    const difficultyColor = level.difficulty === 'hard' ? '#FF6B6B' : '#4CAF50';
    ctx.fillStyle = difficultyColor;
    ctx.textAlign = 'right';
    ctx.fillText(getDifficultyText(level.difficulty), cardX + cardWidth - 20, cardY + 35);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#6B5B4F';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`卡牌种类：${level.cardTypes.length}种`, cardX + 20, cardY + 60);
    ctx.fillText(`卡牌数量：${level.cardCount}张`, cardX + 20, cardY + 80);
    ctx.fillText(level.description, cardX + 20, cardY + 105);

    if (completed) {
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('✓ 已通关', cardX + cardWidth - 20, cardY + 105);
    } else if (!unlocked) {
      ctx.fillStyle = '#999999';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('🔒 未解锁', cardX + cardWidth - 20, cardY + 105);
    }

    gameState.levelCards = gameState.levelCards || [];
    gameState.levelCards[level.id] = { x: cardX, y: cardY, width: cardWidth, height: cardHeight, level };

    y += cardHeight + 15;
  });

  if (gameState.showLockedModal && gameState.lockedLevel) {
    renderLockedModal();
  }
}

function renderLockedModal() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const modalX = canvas.width / 2 - 130;
  const modalY = canvas.height / 2 - 140;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF9A3C';
  ctx.lineWidth = 3;
  roundRect(ctx, modalX, modalY, 260, 280, 15);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔒 关卡未解锁', canvas.width / 2, modalY + 45);

  ctx.fillText('✕', modalX + 240, modalY + 35);
  gameState.lockedModalCloseBtn = { x: modalX + 215, y: modalY + 10, width: 40, height: 35 };

  ctx.font = '48px Arial, sans-serif';
  ctx.fillText('🔐', canvas.width / 2, modalY + 100);

  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillStyle = '#6B5B4F';
  ctx.fillText(gameState.lockedLevel.name, canvas.width / 2, modalY + 135);

  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('此关卡暂时无法进入', canvas.width / 2, modalY + 155);

  const requiredLevel = gameState.lockedLevel ? LEVELS.find(l => l.id === gameState.lockedLevel.id - 1) : null;
  if (requiredLevel) {
    ctx.fillStyle = '#FFF5E6';
    roundRect(ctx, modalX + 20, modalY + 170, 220, 60, 10);
    ctx.fill();
    ctx.strokeStyle = '#FF9A3C';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillStyle = '#6B5B4F';
    ctx.fillText('解锁条件', canvas.width / 2, modalY + 190);
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`🎯 完成「${requiredLevel.name}」`, canvas.width / 2, modalY + 210);
  }

  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = '#6B5B4F';
  ctx.fillText('加油挑战前面的关卡吧！', canvas.width / 2, modalY + 250);

  const confirmBtnX = canvas.width / 2 - 80;
  const confirmBtnY = modalY + 265;
  ctx.fillStyle = '#FF9A3C';
  ctx.strokeStyle = '#E88932';
  ctx.lineWidth = 2;
  roundRect(ctx, confirmBtnX, confirmBtnY, 160, 40, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('我知道了', canvas.width / 2, confirmBtnY + 25);

  gameState.lockedModalConfirmBtn = { x: confirmBtnX, y: confirmBtnY, width: 160, height: 40 };
}

function renderMineTab() {
  const gameStats = getGameStats();
  const levelProgress = getLevelProgress();
  gameState.gameStats = gameStats;
  gameState.levelProgress = levelProgress;

  const isDogKingUnlocked = levelProgress.completedLevels.length === 4;

  ctx.fillStyle = '#FF9A3C';
  roundRect(ctx, 0, 0, canvas.width, 180, 0);
  ctx.fill();

  ctx.font = '48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐕', canvas.width / 2, 80);

  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('狗狗玩家', canvas.width / 2, 110);

  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('开心消除，快乐生活！', canvas.width / 2, 135);

  const achievementY = 160;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 20, achievementY, canvas.width - 40, 220, 15);
  ctx.fill();
  ctx.strokeStyle = '#FF9A3C';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🏆 狗王勋章', 40, achievementY + 35);

  ctx.textAlign = 'right';
  if (isDogKingUnlocked) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('👑 狗王', canvas.width - 40, achievementY + 35);
  }

  ctx.textAlign = 'left';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = '#6B5B4F';
  if (isDogKingUnlocked) {
    ctx.fillText('恭喜！你已成为真正的狗王！', 40, achievementY + 60);
  } else {
    ctx.fillText('通关所有4个关卡，解锁狗王勋章！', 40, achievementY + 60);
  }

  const progressWidth = canvas.width - 80;
  const progressX = 40;
  const progressY = achievementY + 75;
  ctx.fillStyle = '#E5E5E5';
  roundRect(ctx, progressX, progressY, progressWidth, 20, 10);
  ctx.fill();

  const fillWidth = (levelProgress.completedLevels.length / 4) * progressWidth;
  ctx.fillStyle = '#FF9A3C';
  roundRect(ctx, progressX, progressY, fillWidth, 20, 10);
  ctx.fill();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = '14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${levelProgress.completedLevels.length} / 4`, canvas.width / 2, progressY + 15);

  let checkY = achievementY + 105;
  LEVELS.forEach(level => {
    const completed = isLevelCompleted(level.id);
    const bestTime = getBestTime(level.id);

    ctx.fillStyle = completed ? '#4CAF50' : '#999999';
    ctx.font = '20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(completed ? '✓' : '○', 40, checkY);

    ctx.fillStyle = '#6B5B4F';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(level.name, 65, checkY);

    if (completed && bestTime !== undefined) {
      ctx.textAlign = 'right';
      ctx.fillText(`⏱️ ${formatTime(bestTime)}`, canvas.width - 40, checkY);
    }

    checkY += 25;
  });

  const statsY = achievementY + 235;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 20, statsY, canvas.width - 40, 120, 15);
  ctx.fill();
  ctx.strokeStyle = '#FF9A3C';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('游戏数据', 40, statsY + 35);

  const statItems = [
    { value: gameStats.totalWins, label: '通关次数', x: canvas.width / 4 },
    { value: gameStats.highScore, label: '最高分数', x: canvas.width / 2 },
    { value: gameStats.longestWinStreak, label: '最长连胜', x: canvas.width * 3 / 4 }
  ];

  statItems.forEach(stat => {
    ctx.fillStyle = '#FF9A3C';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(stat.value), stat.x, statsY + 75);
    ctx.fillStyle = '#6B5B4F';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(stat.label, stat.x, statsY + 95);
  });

  const menuY = statsY + 135;
  const menuItems = [
    { icon: '📊', text: '游戏记录', action: 'stats' },
    { icon: '📖', text: '游戏说明', action: 'guide' },
    { icon: '⚙️', text: '游戏设置', action: 'settings' },
    { icon: '❤️', text: '关于我们', action: 'about' }
  ];

  gameState.menuButtons = [];

  menuItems.forEach((item, index) => {
    const itemY = menuY + index * 60;
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, 20, itemY, canvas.width - 40, 55, 10);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText(item.icon, 40, itemY + 35);
    ctx.fillStyle = '#6B5B4F';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(item.text, 80, itemY + 35);

    ctx.textAlign = 'right';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText('>', canvas.width - 40, itemY + 35);

    gameState.menuButtons.push({ ...item, x: 20, y: itemY, width: canvas.width - 40, height: 55 });
  });

  if (gameState.showGameStatsModal) {
    renderGameStatsModal();
  }
  if (gameState.showGameGuideModal) {
    renderGameGuideModal();
  }
  if (gameState.showSettingsModal) {
    renderSettingsModal();
  }
}

function renderGameStatsModal() {
  const gameStats = getGameStats();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const modalX = canvas.width / 2 - 130;
  const modalY = canvas.height / 2 - 200;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF9A3C';
  ctx.lineWidth = 3;
  roundRect(ctx, modalX, modalY, 260, 400, 15);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📊 游戏记录', canvas.width / 2, modalY + 40);

  ctx.fillText('✕', modalX + 240, modalY + 30);
  gameState.statsModalCloseBtn = { x: modalX + 215, y: modalY + 5, width: 40, height: 35 };

  let detailY = modalY + 60;
  const detailItems = [
    { icon: '🏆', label: '最高分', value: String(gameStats.highScore) },
    { icon: '🎮', label: '通关次数', value: String(gameStats.totalWins) },
    { icon: '🔥', label: '最长连胜', value: String(gameStats.longestWinStreak) },
    { icon: '📈', label: '当前连胜', value: String(gameStats.currentWinStreak) }
  ];

  detailItems.forEach(item => {
    ctx.fillStyle = '#FFF5E6';
    roundRect(ctx, modalX + 20, detailY, 220, 50, 10);
    ctx.fill();

    ctx.fillStyle = '#6B5B4F';
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.icon, modalX + 35, detailY + 33);

    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(item.label, modalX + 70, detailY + 30);
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#FF9A3C';
    ctx.textAlign = 'right';
    ctx.fillText(item.value, modalX + 230, detailY + 33);

    detailY += 60;
  });
}

function renderGameGuideModal() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const modalX = canvas.width / 2 - 130;
  const modalY = canvas.height / 2 - 180;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF9A3C';
  ctx.lineWidth = 3;
  roundRect(ctx, modalX, modalY, 260, 360, 15);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📖 游戏说明', canvas.width / 2, modalY + 40);

  ctx.fillText('✕', modalX + 240, modalY + 30);
  gameState.guideModalCloseBtn = { x: modalX + 215, y: modalY + 5, width: 40, height: 35 };

  ctx.textAlign = 'left';
  ctx.font = '14px Arial, sans-serif';
  let guideY = modalY + 65;
  const guideTexts = [
    '1. 点击未被遮挡的卡牌',
    '2. 凑齐3张相同的就能消除',
    '3. 卡槽满了就输了哦～',
    '4. 每局有2次洗牌机会',
    '5. 每局有2次撤回机会',
    '6. 失败1次后需要分享才能继续'
  ];

  guideTexts.forEach(text => {
    ctx.fillText(text, modalX + 25, guideY);
    guideY += 30;
  });
}

function renderSettingsModal() {
  const settings = getSettings();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const modalX = canvas.width / 2 - 130;
  const modalY = canvas.height / 2 - 150;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF9A3C';
  ctx.lineWidth = 3;
  roundRect(ctx, modalX, modalY, 260, 300, 15);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6B5B4F';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚙️ 游戏设置', canvas.width / 2, modalY + 40);

  ctx.fillText('✕', modalX + 240, modalY + 30);
  gameState.settingsModalCloseBtn = { x: modalX + 215, y: modalY + 5, width: 40, height: 35 };

  ctx.textAlign = 'left';
  ctx.font = '16px Arial, sans-serif';

  const soundY = modalY + 70;
  ctx.fillText('🔊 音效', modalX + 30, soundY + 25);
  
  ctx.fillStyle = settings.soundEnabled ? '#4CAF50' : '#CCCCCC';
  roundRect(ctx, modalX + 170, soundY, 70, 35, 17);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(settings.soundEnabled ? (modalX + 225) : (modalX + 185), soundY + 17, 14, 0, 2 * Math.PI);
  ctx.fill();

  gameState.soundToggleBtn = { x: modalX + 170, y: soundY, width: 70, height: 35 };

  const musicY = modalY + 125;
  ctx.fillStyle = '#6B5B4F';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText('🎵 音乐', modalX + 30, musicY + 25);

  ctx.fillStyle = settings.musicEnabled ? '#4CAF50' : '#CCCCCC';
  roundRect(ctx, modalX + 170, musicY, 70, 35, 17);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(settings.musicEnabled ? (modalX + 225) : (modalX + 185), musicY + 17, 14, 0, 2 * Math.PI);
  ctx.fill();

  gameState.musicToggleBtn = { x: modalX + 170, y: musicY, width: 70, height: 35 };
}

function renderTabBar() {
  const tabBarY = canvas.height - 60;
  const tabWidth = canvas.width / 3;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, tabBarY, canvas.width, 60);

  ctx.strokeStyle = '#E5E5E5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, tabBarY);
  ctx.lineTo(canvas.width, tabBarY);
  ctx.stroke();

  const tabs = [
    { index: 0, label: '游戏' },
    { index: 1, label: '关卡' },
    { index: 2, label: '我的' }
  ];

  tabs.forEach(tab => {
    const isActive = gameState.currentTab === tab.index;
    const x = tab.index * tabWidth;
    
    ctx.fillStyle = isActive ? '#FF9A3C' : '#6B5B4F';
    ctx.font = isActive ? 'bold 16px Arial, sans-serif' : '16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tab.label, x + tabWidth / 2, tabBarY + 38);

    gameState.tabButtons = gameState.tabButtons || [];
    gameState.tabButtons[tab.index] = { x, y: tabBarY, width: tabWidth, height: 60, index: tab.index };
  });
}

wx.onTouchStart(function(res) {
  const touch = res.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;
  console.log('Touch start:', x, y);

  if (gameState.currentTab === 0) {
    handleGameTabClick(x, y);
  } else if (gameState.currentTab === 1) {
    handleLevelTabClick(x, y);
  } else if (gameState.currentTab === 2) {
    handleMineTabClick(x, y);
  }

  if (gameState.tabButtons) {
    for (let i = 0; i < gameState.tabButtons.length; i++) {
      const btn = gameState.tabButtons[i];
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        gameState.currentTab = btn.index;
        render();
        return;
      }
    }
  }
});

function handleGameTabClick(x, y) {
  if (gameState.showGameStatsModal || gameState.showGameGuideModal || gameState.showSettingsModal || gameState.showLockedModal) {
    return;
  }

  if (gameState.showStartScreen) {
    if (gameState.startBtn && x >= gameState.startBtn.x && x <= gameState.startBtn.x + gameState.startBtn.width && y >= gameState.startBtn.y && y <= gameState.startBtn.y + gameState.startBtn.height) {
      startGame(gameState.currentLevel);
      return;
    }
  }

  if (gameState.gamePaused && gameState.pauseContinueBtn) {
    if (x >= gameState.pauseContinueBtn.x && x <= gameState.pauseContinueBtn.x + gameState.pauseContinueBtn.width && y >= gameState.pauseContinueBtn.y && y <= gameState.pauseContinueBtn.y + gameState.pauseContinueBtn.height) {
      gameState.gamePaused = false;
      render();
      return;
    }
  }

  if (gameState.showLoseModal) {
    if (gameState.loseShareBtn && x >= gameState.loseShareBtn.x && x <= gameState.loseShareBtn.x + gameState.loseShareBtn.width && y >= gameState.loseShareBtn.y && y <= gameState.loseShareBtn.y + gameState.loseShareBtn.height) {
      wx.shareAppMessage({
        title: '狗了个狗 - 超好玩的狗狗消除游戏！',
        imageUrl: '',
        success: function() {
          try {
            const timestamp = Date.now();
            console.log('保存分享状态:', timestamp);
            wx.setStorageSync(SHARE_KEY, timestamp);
            gameState.hasShared = true;
            wx.showToast({
              title: '分享成功！',
              icon: 'success',
              duration: 1000
            });
            render();
          } catch (e) {
            console.error('保存分享状态失败:', e);
          }
        }
      });
      return;
    }

    if (gameState.loseHomeBtn && x >= gameState.loseHomeBtn.x && x <= gameState.loseHomeBtn.x + gameState.loseHomeBtn.width && y >= gameState.loseHomeBtn.y && y <= gameState.loseHomeBtn.y + gameState.loseHomeBtn.height) {
      gameState.showLoseModal = false;
      gameState.showStartScreen = true;
      render();
      return;
    }

    if (gameState.loseRestartBtn && x >= gameState.loseRestartBtn.x && x <= gameState.loseRestartBtn.x + gameState.loseRestartBtn.width && y >= gameState.loseRestartBtn.y && y <= gameState.loseRestartBtn.y + gameState.loseRestartBtn.height) {
      handleLoseConfirm();
      return;
    }
    return;
  }

  if (gameState.showWinModal) {
    if (gameState.winNextBtn && x >= gameState.winNextBtn.x && x <= gameState.winNextBtn.x + gameState.winNextBtn.width && y >= gameState.winNextBtn.y && y <= gameState.winNextBtn.y + gameState.winNextBtn.height) {
      handleNextLevel();
      return;
    }
    if (gameState.winHomeBtn && x >= gameState.winHomeBtn.x && x <= gameState.winHomeBtn.x + gameState.winHomeBtn.width && y >= gameState.winHomeBtn.y && y <= gameState.winHomeBtn.y + gameState.winHomeBtn.height) {
      gameState.showWinModal = false;
      gameState.showStartScreen = true;
      render();
      return;
    }
    return;
  }

  if (gameState.pauseBtn && x >= gameState.pauseBtn.x && x <= gameState.pauseBtn.x + gameState.pauseBtn.width && y >= gameState.pauseBtn.y && y <= gameState.pauseBtn.y + gameState.pauseBtn.height) {
    gameState.gamePaused = !gameState.gamePaused;
    render();
    return;
  }

  if (!gameState.gamePaused && !gameState.showStartScreen && gameState.controlButtons) {
    for (const btn of gameState.controlButtons) {
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        if (btn.action === 'undo' && !btn.disabled) {
          handleUndo();
        } else if (btn.action === 'shuffle' && !btn.disabled) {
          handleShuffle();
        } else if (btn.action === 'restart' && !btn.disabled) {
          handleRestart();
        }
        return;
      }
    }
  }

  if (!gameState.gamePaused && !gameState.showStartScreen) {
    const clickableCards = gameState.cards
      .filter(c => c.status === 0)
      .sort((a, b) => b.zIndex - a.zIndex);

    for (const card of clickableCards) {
      if (x >= card.x && x <= card.x + card.width && y >= card.y && y <= card.y + card.height) {
        handleCardClick(card);
        return;
      }
    }
  }
}

function handleLevelTabClick(x, y) {
  if (gameState.showLockedModal) {
    if (gameState.lockedModalCloseBtn && x >= gameState.lockedModalCloseBtn.x && x <= gameState.lockedModalCloseBtn.x + gameState.lockedModalCloseBtn.width && y >= gameState.lockedModalCloseBtn.y && y <= gameState.lockedModalCloseBtn.y + gameState.lockedModalCloseBtn.height) {
      gameState.showLockedModal = false;
      gameState.lockedLevel = null;
      render();
      return;
    }

    if (gameState.lockedModalConfirmBtn && x >= gameState.lockedModalConfirmBtn.x && x <= gameState.lockedModalConfirmBtn.x + gameState.lockedModalConfirmBtn.width && y >= gameState.lockedModalConfirmBtn.y && y <= gameState.lockedModalConfirmBtn.y + gameState.lockedModalConfirmBtn.height) {
      gameState.showLockedModal = false;
      gameState.lockedLevel = null;
      render();
      return;
    }

    return;
  }

  if (gameState.levelCards) {
    for (const key in gameState.levelCards) {
      const card = gameState.levelCards[key];
      if (x >= card.x && x <= card.x + card.width && y >= card.y && y <= card.y + card.height) {
        handleLevelClick(card.level);
        return;
      }
    }
  }
}

function handleMineTabClick(x, y) {
  if (gameState.showGameStatsModal) {
    if (gameState.statsModalCloseBtn && x >= gameState.statsModalCloseBtn.x && x <= gameState.statsModalCloseBtn.x + gameState.statsModalCloseBtn.width && y >= gameState.statsModalCloseBtn.y && y <= gameState.statsModalCloseBtn.y + gameState.statsModalCloseBtn.height) {
      gameState.showGameStatsModal = false;
      render();
      return;
    }
  }

  if (gameState.showGameGuideModal) {
    if (gameState.guideModalCloseBtn && x >= gameState.guideModalCloseBtn.x && x <= gameState.guideModalCloseBtn.x + gameState.guideModalCloseBtn.width && y >= gameState.guideModalCloseBtn.y && y <= gameState.guideModalCloseBtn.y + gameState.guideModalCloseBtn.height) {
      gameState.showGameGuideModal = false;
      render();
      return;
    }
  }

  if (gameState.showSettingsModal) {
    if (gameState.settingsModalCloseBtn && x >= gameState.settingsModalCloseBtn.x && x <= gameState.settingsModalCloseBtn.x + gameState.settingsModalCloseBtn.width && y >= gameState.settingsModalCloseBtn.y && y <= gameState.settingsModalCloseBtn.y + gameState.settingsModalCloseBtn.height) {
      gameState.showSettingsModal = false;
      render();
      return;
    }

    if (gameState.soundToggleBtn && x >= gameState.soundToggleBtn.x && x <= gameState.soundToggleBtn.x + gameState.soundToggleBtn.width && y >= gameState.soundToggleBtn.y && y <= gameState.soundToggleBtn.y + gameState.soundToggleBtn.height) {
      toggleSound();
      render();
      return;
    }

    if (gameState.musicToggleBtn && x >= gameState.musicToggleBtn.x && x <= gameState.musicToggleBtn.x + gameState.musicToggleBtn.width && y >= gameState.musicToggleBtn.y && y <= gameState.musicToggleBtn.y + gameState.musicToggleBtn.height) {
      toggleMusic();
      render();
      return;
    }

    return;
  }

  if (gameState.menuButtons) {
    for (const btn of gameState.menuButtons) {
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        if (btn.action === 'stats') {
          gameState.showGameStatsModal = true;
        } else if (btn.action === 'guide') {
          gameState.showGameGuideModal = true;
        } else if (btn.action === 'settings') {
          gameState.showSettingsModal = true;
        }
        render();
        return;
      }
    }
  }
}

wx.onShowShareAppMessage(function() {
  return {
    title: '狗了个狗 - 超好玩的狗狗消除游戏！',
    imageUrl: ''
  };
});

setInterval(() => {
  try {
    const shared = wx.getStorageSync(SHARE_KEY);
    if (shared && !gameState.hasShared) {
      gameState.hasShared = true;
      wx.showToast({
        title: '分享成功！',
        icon: 'success',
        duration: 1000
      });
      render();
    }
  } catch (e) {
    console.error('检查分享状态失败:', e);
  }
}, 500);

initApp();