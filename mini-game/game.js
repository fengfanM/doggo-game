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
  { id: 1, name: '新手试炼', difficulty: 'easy', description: '让你觉得你很行～' },
  { id: 2, name: '初露锋芒', difficulty: 'easy', description: '难度逐渐增加' },
  { id: 3, name: '极限挑战', difficulty: 'hard', description: '开始有挑战了！' },
  { id: 4, name: '狗王挑战', difficulty: 'hard', description: '终极挑战！通关率<10%' },
];

const STATS_KEY = 'dog_game_stats';
const SHARE_KEY = 'dog_game_shared';

function getGameStats() {
  try {
    return wx.getStorageSync(STATS_KEY) || {
      highScore: 0,
      totalWins: 0,
      currentWinStreak: 0,
      longestWinStreak: 0
    };
  } catch (e) {
    return {
      highScore: 0,
      totalWins: 0,
      currentWinStreak: 0,
      longestWinStreak: 0
    };
  }
}

function saveGameStats(stats) {
  try {
    wx.setStorageSync(STATS_KEY, stats);
  } catch (e) {
    console.error('保存游戏统计失败:', e);
  }
}

function completeLevel(level, time) {
  try {
    const key = `level_${level}_time`;
    const current = wx.getStorageSync(key) || Infinity;
    if (time < current) {
      wx.setStorageSync(key, time);
    }
  } catch (e) {
    console.error('保存关卡记录失败:', e);
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  const centerX = Math.min(180, systemInfo.windowWidth / 2);
  const centerY = Math.min(230, systemInfo.windowHeight / 2);

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
  const centerX = Math.min(180, systemInfo.windowWidth / 2);
  const centerY = Math.min(230, systemInfo.windowHeight / 2);

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

function initGame(level = 1) {
  const cards = checkCover(generateCards(level));
  const gameStats = getGameStats();
  
  gameState = {
    currentLevel: level,
    cards,
    queue: [],
    score: 0,
    elapsedTime: 0,
    undoCount: 2,
    shuffleCount: 2,
    failCount: 0,
    hasShared: false,
    gamePaused: false,
    showStartScreen: true,
    showLoseModal: false,
    showWinModal: false,
    gameStats,
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

function render() {
  console.log('=== render 被调用 ===');
  console.log('gameState.showStartScreen:', gameState.showStartScreen);
  console.log('gameState.cards 数量:', gameState.cards ? gameState.cards.length : 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FEF3E2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.showStartScreen) {
    console.log('渲染开始页面');
    renderStartScreen();
    return;
  }

  console.log('渲染游戏页面');
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

canvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  handleClick(x, y);
});

function handleClick(x, y) {
  if (gameState.showStartScreen) {
    if (gameState.startBtn &&
        x >= gameState.startBtn.x && x <= gameState.startBtn.x + gameState.startBtn.width &&
        y >= gameState.startBtn.y && y <= gameState.startBtn.y + gameState.startBtn.height) {
      startGame(1);
    }
    return;
  }

  if (gameState.pauseBtn &&
      x >= gameState.pauseBtn.x && x <= gameState.pauseBtn.x + gameState.pauseBtn.width &&
      y >= gameState.pauseBtn.y && y <= gameState.pauseBtn.y + gameState.pauseBtn.height) {
    if (!gameState.showLoseModal && !gameState.showWinModal) {
      gameState.gamePaused = !gameState.gamePaused;
      render();
    }
    return;
  }

  if (gameState.gamePaused && gameState.pauseContinueBtn) {
    if (x >= gameState.pauseContinueBtn.x && x <= gameState.pauseContinueBtn.x + gameState.pauseContinueBtn.width &&
        y >= gameState.pauseContinueBtn.y && y <= gameState.pauseContinueBtn.y + gameState.pauseContinueBtn.height) {
      gameState.gamePaused = false;
      render();
      return;
    }
  }

  if (gameState.showLoseModal) {
    if (gameState.loseRestartBtn &&
        x >= gameState.loseRestartBtn.x && x <= gameState.loseRestartBtn.x + gameState.loseRestartBtn.width &&
        y >= gameState.loseRestartBtn.y && y <= gameState.loseRestartBtn.y + gameState.loseRestartBtn.height) {
      handleLoseConfirm();
      return;
    }
    if (gameState.loseShareBtn) {
      if (x >= gameState.loseShareBtn.x && x <= gameState.loseShareBtn.x + gameState.loseShareBtn.width &&
          y >= gameState.loseShareBtn.y && y <= gameState.loseShareBtn.y + gameState.loseShareBtn.height) {
        wx.showShareMenu({ withShareTicket: true });
        try {
          wx.setStorageSync(SHARE_KEY, Date.now());
          gameState.hasShared = true;
          render();
        } catch (e) {
          console.error('保存分享状态失败:', e);
        }
        return;
      }
    }
    if (gameState.loseHomeBtn &&
        x >= gameState.loseHomeBtn.x && x <= gameState.loseHomeBtn.x + gameState.loseHomeBtn.width &&
        y >= gameState.loseHomeBtn.y && y <= gameState.loseHomeBtn.y + gameState.loseHomeBtn.height) {
      if (gameState.timer) clearInterval(gameState.timer);
      initGame(gameState.currentLevel);
      return;
    }
    return;
  }

  if (gameState.showWinModal) {
    if (gameState.winNextBtn &&
        x >= gameState.winNextBtn.x && x <= gameState.winNextBtn.x + gameState.winNextBtn.width &&
        y >= gameState.winNextBtn.y && y <= gameState.winNextBtn.y + gameState.winNextBtn.height) {
      if (gameState.currentLevel >= 4) {
        startGame(1);
      } else {
        startGame(gameState.currentLevel + 1);
      }
      return;
    }
    if (gameState.winHomeBtn &&
        x >= gameState.winHomeBtn.x && x <= gameState.winHomeBtn.x + gameState.winHomeBtn.width &&
        y >= gameState.winHomeBtn.y && y <= gameState.winHomeBtn.y + gameState.winHomeBtn.height) {
      if (gameState.timer) clearInterval(gameState.timer);
      initGame(gameState.currentLevel);
      return;
    }
    return;
  }

  if (gameState.controlButtons) {
    for (const btn of gameState.controlButtons) {
      if (x >= btn.x && x <= btn.x + btn.width &&
          y >= btn.y && y <= btn.y + btn.height) {
        if (btn.action === 'undo' && !btn.disabled) {
          handleUndo();
        } else if (btn.action === 'shuffle' && !btn.disabled) {
          handleShuffle();
        } else if (btn.action === 'restart') {
          handleRestart();
        }
        return;
      }
    }
  }

  const sortedCards = [...gameState.cards]
    .filter(c => c.status === 0 && !c.isCover)
    .sort((a, b) => b.zIndex - a.zIndex);

  for (const card of sortedCards) {
    if (x >= card.x && x <= card.x + card.width &&
        y >= card.y && y <= card.y + card.height) {
      handleCardClick(card);
      return;
    }
  }
}

function handleCardClick(card) {
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
    const newStats = { ...gameState.gameStats };
    newStats.highScore = Math.max(newStats.highScore, newScore);
    newStats.totalWins += 1;
    newStats.currentWinStreak += 1;
    newStats.longestWinStreak = Math.max(newStats.longestWinStreak, newStats.currentWinStreak);
    saveGameStats(newStats);
    gameState.gameStats = newStats;
    completeLevel(gameState.currentLevel, gameState.elapsedTime);
    if (gameState.timer) {
      clearInterval(gameState.timer);
    }
  }

  render();
}

function handleUndo() {
  if (gameState.history.length === 0) return;
  const lastState = gameState.history.pop();
  gameState.cards = lastState.cards;
  gameState.queue = lastState.queue;
  gameState.score = lastState.score;
  gameState.undoCount--;
  render();
}

function handleShuffle() {
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

console.log('=== 小游戏启动 ===');
console.log('Canvas 宽高:', canvas.width, 'x', canvas.height);
console.log('System info:', systemInfo);

ctx.fillStyle = 'red';
ctx.fillRect(0, 0, 100, 100);
console.log('已绘制测试红色方块');

initGame(1);
