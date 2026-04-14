import Taro from '@tarojs/taro';
import { DailyTask, Skin, DailyStats, UserData } from '@/types/game';

const STORAGE_KEY = 'doge-doge-user-data';

export const DEFAULT_SKINS: Skin[] = [
  { id: 'default', name: '经典狗狗', emoji: '🐕', color: '#FFA500', unlocked: true },
  { id: 'golden', name: '金毛犬', emoji: '🦮', color: '#FFD700', unlocked: false },
  { id: 'poodle', name: '贵宾犬', emoji: '🐩', color: '#FF69B4', unlocked: false },
  { id: 'pomeranian', name: '博美犬', emoji: '🦊', color: '#FF8C00', unlocked: false },
  { id: 'husky', name: '哈士奇', emoji: '🐺', color: '#4169E1', unlocked: false },
];

export const generateDailyTasks = (): DailyTask[] => [
  {
    id: 'clear-100',
    title: '消除达人',
    description: '今天消除100张卡牌',
    target: 100,
    current: 0,
    completed: false,
    reward: '金毛犬皮肤'
  },
  {
    id: 'play-5',
    title: '游戏达人',
    description: '今天玩5局游戏',
    target: 5,
    current: 0,
    completed: false,
    reward: '贵宾犬皮肤'
  },
  {
    id: 'score-500',
    title: '得分达人',
    description: '今天累计获得500分',
    target: 500,
    current: 0,
    completed: false,
    reward: '博美犬皮肤'
  },
  {
    id: 'level-3',
    title: '关卡达人',
    description: '今天通过第3关',
    target: 1,
    current: 0,
    completed: false,
    reward: '哈士奇皮肤'
  },
];

export const getTodayDate = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const safeGetStorage = (): UserData | null => {
  try {
    const saved = Taro.getStorageSync(STORAGE_KEY);
    if (saved && typeof saved === 'string') {
      return JSON.parse(saved);
    } else if (saved) {
      return saved;
    }
  } catch (e) {
    console.error('获取存储失败:', e);
  }
  return null;
};

const safeSetStorage = (data: UserData): void => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存存储失败:', e);
  }
};

export const loadUserData = (): UserData => {
  const saved = safeGetStorage();
  if (saved) {
    const data = saved as UserData;
    
    if (data.dailyStats && data.dailyStats.date !== getTodayDate()) {
      data.dailyStats = null;
    }
    
    if (!data.skins || data.skins.length === 0) {
      data.skins = DEFAULT_SKINS;
    }
    
    return data;
  }
  
  return {
    totalCardsCleared: 0,
    totalGamesPlayed: 0,
    totalScore: 0,
    skins: DEFAULT_SKINS,
    dailyStats: null
  };
};

export const saveUserData = (data: UserData): void => {
  safeSetStorage(data);
};

export const getOrCreateDailyStats = (userData: UserData): DailyStats => {
  const today = getTodayDate();
  
  if (userData.dailyStats && userData.dailyStats.date === today) {
    return userData.dailyStats;
  }
  
  return {
    date: today,
    cardsCleared: 0,
    gamesPlayed: 0,
    totalScore: 0,
    tasks: generateDailyTasks()
  };
};

export const recordCardsCleared = (count: number): void => {
  const userData = loadUserData();
  const dailyStats = getOrCreateDailyStats(userData);
  
  userData.totalCardsCleared += count;
  dailyStats.cardsCleared += count;
  
  dailyStats.tasks = dailyStats.tasks.map(task => {
    if (task.id === 'clear-100' && !task.completed) {
      const newCurrent = task.current + count;
      const completed = newCurrent >= task.target;
      return { ...task, current: newCurrent, completed };
    }
    return task;
  });
  
  userData.dailyStats = dailyStats;
  checkAndUnlockSkins(userData);
  saveUserData(userData);
};

export const recordGamePlayed = (): void => {
  const userData = loadUserData();
  const dailyStats = getOrCreateDailyStats(userData);
  
  userData.totalGamesPlayed += 1;
  dailyStats.gamesPlayed += 1;
  
  dailyStats.tasks = dailyStats.tasks.map(task => {
    if (task.id === 'play-5' && !task.completed) {
      const newCurrent = task.current + 1;
      const completed = newCurrent >= task.target;
      return { ...task, current: newCurrent, completed };
    }
    return task;
  });
  
  userData.dailyStats = dailyStats;
  checkAndUnlockSkins(userData);
  saveUserData(userData);
};

export const recordScore = (score: number): void => {
  const userData = loadUserData();
  const dailyStats = getOrCreateDailyStats(userData);
  
  userData.totalScore += score;
  dailyStats.totalScore += score;
  
  dailyStats.tasks = dailyStats.tasks.map(task => {
    if (task.id === 'score-500' && !task.completed) {
      const newCurrent = task.current + score;
      const completed = newCurrent >= task.target;
      return { ...task, current: newCurrent, completed };
    }
    return task;
  });
  
  userData.dailyStats = dailyStats;
  checkAndUnlockSkins(userData);
  saveUserData(userData);
};

export const recordLevelPassed = (level: number): void => {
  if (level < 3) return;
  
  const userData = loadUserData();
  const dailyStats = getOrCreateDailyStats(userData);
  
  dailyStats.tasks = dailyStats.tasks.map(task => {
    if (task.id === 'level-3' && !task.completed) {
      const newCurrent = task.current + 1;
      const completed = newCurrent >= task.target;
      return { ...task, current: newCurrent, completed };
    }
    return task;
  });
  
  userData.dailyStats = dailyStats;
  checkAndUnlockSkins(userData);
  saveUserData(userData);
};

export const checkAndUnlockSkins = (userData: UserData): void => {
  const dailyStats = userData.dailyStats;
  if (!dailyStats) return;
  
  dailyStats.tasks.forEach(task => {
    if (task.completed) {
      let skinId: string | null = null;
      
      switch (task.id) {
        case 'clear-100':
          skinId = 'golden';
          break;
        case 'play-5':
          skinId = 'poodle';
          break;
        case 'score-500':
          skinId = 'pomeranian';
          break;
        case 'level-3':
          skinId = 'husky';
          break;
      }
      
      if (skinId) {
        const skin = userData.skins.find(s => s.id === skinId);
        if (skin && !skin.unlocked) {
          skin.unlocked = true;
        }
      }
    }
  });
};

export const getDailyTasks = (): DailyTask[] => {
  const userData = loadUserData();
  const dailyStats = getOrCreateDailyStats(userData);
  return dailyStats.tasks;
};

export const getSkins = (): Skin[] => {
  const userData = loadUserData();
  return userData.skins;
};
