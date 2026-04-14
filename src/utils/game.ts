import { Card } from '@/types/game';

export const generateId = (len: number = 6): string => {
  const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let res = '';
  while (len > 0) {
    res += pool[Math.floor(pool.length * Math.random())];
    len--;
  }
  return res;
};

export const waitTimeout = (timeout: number): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};

export const timestampToUsedTimeString = (time: number): string => {
  try {
    const hours = Math.floor(time / (1000 * 60 * 60));
    const minutes = Math.floor(
      (time - 1000 * 60 * 60 * hours) / (1000 * 60)
    );
    const seconds = (
      (time - 1000 * 60 * 60 * hours - 1000 * 60 * minutes) /
      1000
    ).toFixed(1);
    if (hours) {
      return `${hours}小时${minutes}分${seconds}秒`;
    } else if (minutes) {
      return `${minutes}分${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  } catch (e) {
    return '时间转换出错';
  }
};

const levelConfig = [
  { types: 3, cardsPerType: 6, layers: 2, layerOffset: 15 },
  { types: 5, cardsPerType: 9, layers: 3, layerOffset: 18 },
  { types: 7, cardsPerType: 9, layers: 4, layerOffset: 22 },
  { types: 10, cardsPerType: 9, layers: 6, layerOffset: 28 },
];

export const generateCards = (level: number, cardTypes: string[]): Card[] => {
  const cards: Card[] = [];
  
  const config = levelConfig[Math.min(level - 1, levelConfig.length - 1)];
  const iconPool = cardTypes.slice(0, config.types);
  
  const allCards: { type: string; emoji: string }[] = [];
  for (const type of iconPool) {
    for (let i = 0; i < config.cardsPerType; i++) {
      allCards.push({ type, emoji: type });
    }
  }
  
  const shuffledCards = fastShuffle(allCards);
  
  const layerCards: { type: string; emoji: string }[][] = [];
  
  if (level === 4) {
    const typeIndices: Record<string, number[]> = {};
    iconPool.forEach(type => {
      typeIndices[type] = [];
    });
    
    shuffledCards.forEach((card, index) => {
      typeIndices[card.type].push(index);
    });
    
    const layerAssignments: number[] = new Array(shuffledCards.length).fill(0);
    
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
        zIndex: zIndex++,
        isCover: false,
        status: 0
      });
    }
  }
  
  return checkCover(cards);
};

export const fastShuffle = <T>(arr: T[]): T[] => {
  const res = arr.slice();
  for (let i = 0; i < res.length; i++) {
    const idx = Math.floor(Math.random() * res.length);
    [res[i], res[idx]] = [res[idx], res[i]];
  }
  return res;
};

export const checkCover = (cards: Card[]): Card[] => {
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
};

export const washCards = (level: number, cards: Card[]): Card[] => {
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
};

export const sortQueueCards = (queue: Card[]): Card[] => {
  const cache: Record<string, Card[]> = {};
  
  for (const card of queue) {
    const key = card.type;
    if (cache[key]) {
      cache[key].push(card);
    } else {
      cache[key] = [card];
    }
  }
  
  const temp: Card[] = [];
  for (const cards of Object.values(cache)) {
    temp.push(...cards);
  }
  
  return temp;
};

export const sortQueue = (queue: Card[]): Record<string, number> => {
  const sortedCards = sortQueueCards(queue);
  const sortedQueue: Record<string, number> = {};
  let x = 50;
  for (const card of sortedCards) {
    sortedQueue[card.id] = x;
    x += 90;
  }
  
  return sortedQueue;
};

export const isGameOver = (queue: Card[]): boolean => {
  return queue.length === 7;
};

export const isWin = (cards: Card[]): boolean => {
  return !cards.find((c) => c.status !== 2);
};

export const debugCardCounts = (cards: Card[], prefix: string = ''): Record<string, number> => {
  const counts: Record<string, number> = {};
  cards.forEach(card => {
    const key = card.type;
    if (counts[key]) {
      counts[key]++;
    } else {
      counts[key] = 1;
    }
  });
  
  if (prefix) {
    console.log(`[${prefix}] 卡牌分布:`, counts);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`[${prefix}] 总牌数:`, total);
  }
  
  return counts;
};

export const debugGameState = (cards: Card[], queue: Card[], prefix: string = ''): void => {
  if (prefix) {
    console.log(`=== [${prefix}] 游戏状态调试 ===`);
  }
  
  const activeCards = cards.filter(c => c.status === 0);
  const queuedCards = cards.filter(c => c.status === 1);
  const eliminatedCards = cards.filter(c => c.status === 2);
  
  console.log('场上活跃牌 (status=0):', debugCardCounts(activeCards));
  console.log('卡槽中的牌 (status=1):', debugCardCounts(queuedCards));
  console.log('已消除的牌 (status=2):', debugCardCounts(eliminatedCards));
  
  const queueTypes: Record<string, number> = {};
  queue.forEach(card => {
    const key = card.type;
    if (queueTypes[key]) {
      queueTypes[key]++;
    } else {
      queueTypes[key] = 1;
    }
  });
  console.log('当前卡槽内容:', queueTypes);
  console.log('====================================');
};

export const checkSolvabilityHeuristic = (cards: Card[]): boolean => {
  const activeCards = cards.filter(c => c.status === 0);
  const cardCounts: Record<string, number> = {};
  
  activeCards.forEach(card => {
    const key = card.type;
    if (cardCounts[key]) {
      cardCounts[key]++;
    } else {
      cardCounts[key] = 1;
    }
  });
  
  for (const type in cardCounts) {
    if (cardCounts[type] % 3 !== 0) {
      console.warn(`[可解性预检查] 警告: ${type} 类型的卡牌数量 ${cardCounts[type]} 不是 3 的倍数!`);
      return false;
    }
  }
  
  console.log('[可解性预检查] 通过: 所有类型卡牌数量都是 3 的倍数');
  return true;
};
