import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import GameBoard from '@/components/GameBoard';
import CardSlot from '@/components/CardSlot';
import { Card } from '@/types/game';
import { DOG_EMOJIS } from '@/data/levels';
import { generateCards, checkCover, washCards, debugCardCounts, debugGameState, checkSolvabilityHeuristic } from '@/utils/game';
import { getGameStats, saveGameStats, completeLevel, formatTime } from '@/utils/storage';
import styles from './index.module.scss';

const MAX_LEVEL = 4;
const SHARE_STORAGE_KEY = 'dog_game_shared';

let setHasSharedRef: React.Dispatch<React.SetStateAction<boolean>> | null = null;

const Game: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [queue, setQueue] = useState<Card[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gamePaused, setGamePaused] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [undoCount, setUndoCount] = useState(2);
  const [shuffleCount, setShuffleCount] = useState(2);
  const [failCount, setFailCount] = useState(0);
  const [hasShared, setHasShared] = useState(false);
  const [gameStats, setGameStats] = useState(getGameStats());
  const [elapsedTime, setElapsedTime] = useState(0);
  const historyRef = useRef<Array<{ cards: Card[]; queue: Card[]; score: number }>>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStateRef = useRef({
    gamePaused: false,
    showLoseModal: false,
    showWinModal: false,
    showStartScreen: true
  });

  useEffect(() => {
    setHasSharedRef = setHasShared;
    return () => {
      setHasSharedRef = null;
    };
  }, []);

  useEffect(() => {
    const checkShareStatus = () => {
      try {
        const shared = Taro.getStorageSync(SHARE_STORAGE_KEY);
        console.log('[checkShareStatus] 本地存储分享状态:', shared);
        console.log('[checkShareStatus] 当前 hasShared:', hasShared);
        if (!!shared && !hasShared) {
          console.log('[checkShareStatus] 更新 hasShared 为 true');
          setHasShared(true);
        }
      } catch (e) {
        console.error('检查分享状态失败:', e);
      }
    };
    checkShareStatus();
    
    if (showLoseModal) {
      console.log('[checkShareStatus] 开始轮询检查分享状态');
      const interval = setInterval(() => {
        checkShareStatus();
      }, 500);
      return () => {
        console.log('[checkShareStatus] 停止轮询检查分享状态');
        clearInterval(interval);
      };
    }
  }, [showLoseModal, hasShared]);

  useEffect(() => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }, []);

  const startGame = (lvl: number = 1) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const newCards = checkCover(generateCards(lvl, DOG_EMOJIS));
    
    console.log('========================================');
    console.log('🎮 游戏开始 - 调试信息');
    console.log('========================================');
    console.log('关卡:', lvl);
    debugCardCounts(newCards, '发牌后');
    checkSolvabilityHeuristic(newCards);
    console.log('========================================');
    
    setCards(newCards);
    setQueue([]);
    setScore(0);
    setLevel(lvl);
    setShowStartScreen(false);
    setShowLoseModal(false);
    setShowWinModal(false);
    setUndoCount(2);
    setShuffleCount(2);
    setElapsedTime(0);
    setFailCount(0);
    setHasShared(false);
    try {
      Taro.removeStorageSync(SHARE_STORAGE_KEY);
    } catch (e) {
      console.error('清除分享状态失败:', e);
    }
    historyRef.current = [];
    
    timerRef.current = setInterval(() => {
      const { gamePaused, showLoseModal, showWinModal, showStartScreen } = gameStateRef.current;
      if (!gamePaused && !showLoseModal && !showWinModal && !showStartScreen) {
        setElapsedTime(t => t + 1);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setGameStats(getGameStats());
  }, []);

  useEffect(() => {
    gameStateRef.current = {
      gamePaused,
      showLoseModal,
      showWinModal,
      showStartScreen
    };
  }, [gamePaused, showLoseModal, showWinModal, showStartScreen]);

  useEffect(() => {
    console.log('[自动重新开始] useEffect 触发');
    console.log('[自动重新开始] hasShared:', hasShared);
    console.log('[自动重新开始] showLoseModal:', showLoseModal);
    if (hasShared && showLoseModal) {
      console.log('[自动重新开始] 条件满足，自动重新开始游戏！');
      handleLoseConfirm();
    } else {
      console.log('[自动重新开始] 条件不满足');
    }
  }, [hasShared, showLoseModal]);

  const handleCardClick = (cardId: string) => {
    if (gamePaused || showLoseModal || showWinModal) return;

    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const card = cards[cardIndex];
    if (card.isCover || card.status !== 0) return;

    historyRef.current.push({
      cards: JSON.parse(JSON.stringify(cards)),
      queue: JSON.parse(JSON.stringify(queue)),
      score: score
    });
    
    if (historyRef.current.length > 10) {
      historyRef.current.shift();
    }

    const updateScene = cards.slice();
    const symbol = updateScene[cardIndex];
    symbol.status = 1;

    let updateQueue = queue.slice();
    updateQueue.push(symbol);
    
    let newScore = score + 10;
    const checkedCards = checkCover(updateScene);
    setCards(checkedCards);
    setQueue(updateQueue);
    setScore(newScore);

    const typeCounts: Record<string, number> = {};
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
      setScore(newScore);
    }

    setQueue(updateQueue);
    const finalCheckedCards = checkCover(updateScene);
    setCards(finalCheckedCards);

    if (updateQueue.length === 7) {
      setShowLoseModal(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    debugGameState(finalCheckedCards, updateQueue, '点击后');
    
    const winCheck = !finalCheckedCards.find(s => s.status !== 2);
    if (winCheck) {
      console.log('🎉 游戏胜利！');
      debugGameState(finalCheckedCards, updateQueue, '胜利时');
      setShowWinModal(true);
      const newStats = { ...gameStats };
      newStats.highScore = Math.max(newStats.highScore, newScore);
      newStats.totalWins += 1;
      newStats.currentWinStreak += 1;
      newStats.longestWinStreak = Math.max(newStats.longestWinStreak, newStats.currentWinStreak);
      saveGameStats(newStats);
      setGameStats(newStats);
      completeLevel(level, elapsedTime);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleUndo = () => {
    if (gamePaused || historyRef.current.length === 0 || undoCount <= 0) return;
    const lastState = historyRef.current.pop()!;
    setCards(lastState.cards);
    setQueue(lastState.queue);
    setScore(lastState.score);
    setUndoCount(c => c - 1);
  };

  const handleShuffle = () => {
    if (gamePaused || shuffleCount <= 0) return;
    const washedCards = washCards(level, cards);
    setCards(washedCards);
    setShuffleCount(c => c - 1);
  };

  const handleRestart = () => {
    if (failCount >= 1 && !hasShared) {
      Taro.showToast({
        title: '请先分享到微信群！',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    startGame(level);
  };

  const handleStartGame = () => {
    startGame(1);
  };

  const handleTogglePause = () => {
    if (showStartScreen || showLoseModal || showWinModal) return;
    setGamePaused(p => !p);
  };

  const handleLoseConfirm = () => {
    if (failCount >= 1 && !hasShared) {
      Taro.showToast({
        title: '请先分享到微信群！',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const newFailCount = failCount + 1;
    setFailCount(newFailCount);
    if (hasShared) {
      try {
        Taro.removeStorageSync(SHARE_STORAGE_KEY);
        setHasShared(false);
      } catch (e) {
        console.error('清除分享状态失败:', e);
      }
    }
    
    const newStats = { ...gameStats };
    newStats.currentWinStreak = 0;
    saveGameStats(newStats);
    setGameStats(newStats);
    
    const newCards = checkCover(generateCards(level, DOG_EMOJIS));
    
    console.log('========================================');
    console.log('🎮 重新开始 - 调试信息');
    console.log('========================================');
    console.log('关卡:', level);
    console.log('失败次数:', newFailCount);
    debugCardCounts(newCards, '发牌后');
    checkSolvabilityHeuristic(newCards);
    console.log('========================================');
    
    setCards(newCards);
    setQueue([]);
    setScore(0);
    setShowLoseModal(false);
    setShowWinModal(false);
    setUndoCount(2);
    setShuffleCount(2);
    setElapsedTime(0);
    historyRef.current = [];
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      const { gamePaused, showLoseModal, showWinModal, showStartScreen } = gameStateRef.current;
      if (!gamePaused && !showLoseModal && !showWinModal && !showStartScreen) {
        setElapsedTime(t => t + 1);
      }
    }, 1000);
  };

  const handleNextLevel = () => {
    if (level >= MAX_LEVEL) {
      startGame(1);
    } else {
      startGame(level + 1);
    }
  };

  const remainingCards = cards.filter(c => c.status === 0).length;
  const needShare = failCount >= 1 && !hasShared;

  return (
    <View className={styles.container}>
      {showStartScreen ? (
        <View className={styles.startScreen}>
          <View className={styles.startContent}>
            <View className={styles.startLogo}>
              <Text className={styles.logoEmoji}>🐕</Text>
              <Text className={styles.logoTitle}>狗了个狗</Text>
            </View>

            <View className={styles.gameStats}>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{gameStats.highScore}</Text>
                <Text className={styles.statLabel}>最高分</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{gameStats.totalWins}</Text>
                <Text className={styles.statLabel}>通关次数</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{gameStats.longestWinStreak}</Text>
                <Text className={styles.statLabel}>最长连胜</Text>
              </View>
            </View>

            <View className={styles.startDescription}>
              <Text className={styles.descText}>1️⃣ 点击未被遮挡的卡牌</Text>
              <Text className={styles.descText}>2️⃣ 凑齐3张相同的就能消除</Text>
              <Text className={styles.descText}>3️⃣ 卡槽满了就输了哦～</Text>
            </View>

            <View className={styles.startTips}>
              <Text className={styles.tipItem}>🔄 每局有2次洗牌机会</Text>
              <Text className={styles.tipItem}>↩️ 每局有2次撤回机会</Text>
            </View>

            <Button
              className={styles.startButton}
              onClick={handleStartGame}
            >
              🎮 开始游戏
            </Button>
          </View>
        </View>
      ) : (
        <>
          <View className={styles.header}>
            <View className={styles.headerTop}>
              <Text className={styles.title}>🐕 狗了个狗 🐕</Text>
              <Button
                className={styles.pauseButton}
                onClick={handleTogglePause}
              >
                {gamePaused ? '▶️' : '⏸️'}
              </Button>
            </View>
            <View className={styles.stats}>
              <View className={styles.statItem}>
                <Text className={styles.statLabel}>关卡</Text>
                <Text className={styles.statValue}>{level}/{MAX_LEVEL}</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statLabel}>剩余</Text>
                <Text className={styles.statValue}>{remainingCards}</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statLabel}>得分</Text>
                <Text className={styles.statValue}>{score}</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statLabel}>用时</Text>
                <Text className={styles.statValue}>{formatTime(elapsedTime)}</Text>
              </View>
            </View>
          </View>

          <View className={styles.content}>
            <View className={styles.gameArea}>
              <GameBoard
                cards={cards}
                queue={queue}
                sortedQueue={{}}
                onCardClick={handleCardClick}
              />
              {gamePaused && (
                <View className={styles.pauseOverlay}>
                  <View className={styles.pauseModal}>
                    <Text className={styles.pauseTitle}>⏸️ 游戏暂停</Text>
                    <Button
                      className={styles.button}
                      onClick={handleTogglePause}
                    >
                      ▶️ 继续游戏
                    </Button>
                  </View>
                </View>
              )}
              {showLoseModal && (
                <View className={styles.modalOverlay}>
                  <View className={styles.loseModal}>
                    <Text className={styles.modalTitle}>😢 游戏结束</Text>
                    <Text className={styles.modalDesc}>卡槽满了，再试一次吧！</Text>
                    <View className={styles.modalButtons}>
                      {needShare ? (
                        <>
                          <Button
                            className={styles.button}
                            openType="share"
                          >
                            📤 分享到微信群
                          </Button>
                          <Button
                            className={`${styles.button} ${styles.secondary}`}
                            onClick={() => {
                              setShowLoseModal(false);
                              setShowStartScreen(true);
                            }}
                          >
                            🏠 返回首页
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            className={styles.button}
                            onClick={handleLoseConfirm}
                          >
                            🔄 重新开始
                          </Button>
                          <Button
                            className={`${styles.button} ${styles.secondary}`}
                            onClick={() => {
                              setShowLoseModal(false);
                              setShowStartScreen(true);
                            }}
                          >
                            🏠 返回首页
                          </Button>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              )}
              {showWinModal && (
                <View className={styles.modalOverlay}>
                  <View className={styles.winModal}>
                    <Text className={styles.modalTitle}>🎉 恭喜过关！</Text>
                    <View className={styles.winStats}>
                      <View className={styles.winStat}>
                        <Text className={styles.winStatLabel}>本次用时</Text>
                        <Text className={styles.winStatValue}>{formatTime(elapsedTime)}</Text>
                      </View>
                      <View className={styles.winStat}>
                        <Text className={styles.winStatLabel}>得分</Text>
                        <Text className={styles.winStatValue}>{score}</Text>
                      </View>
                    </View>
                    <Text className={styles.modalDesc}>
                      {level >= MAX_LEVEL 
                        ? '你太厉害了！已通关所有关卡！' 
                        : `准备好挑战第 ${level + 1} 关了吗？`}
                    </Text>
                    <View className={styles.modalButtons}>
                      <Button
                        className={styles.button}
                        onClick={handleNextLevel}
                      >
                        {level >= MAX_LEVEL ? '🔄 再玩一次' : '➡️ 下一关'}
                      </Button>
                      <Button
                        className={`${styles.button} ${styles.secondary}`}
                        onClick={() => {
                          setShowWinModal(false);
                          setShowStartScreen(true);
                        }}
                      >
                        🏠 返回首页
                      </Button>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <CardSlot queue={queue} maxSlots={7} />

            <View className={styles.controls}>
              <Button
                className={`${styles.button} ${undoCount <= 0 ? styles.disabled : ''}`}
                onClick={handleUndo}
                disabled={undoCount <= 0}
              >
                ↩️ 撤回 ({undoCount})
              </Button>
              <Button
                className={`${styles.button} ${shuffleCount <= 0 ? styles.disabled : ''}`}
                onClick={handleShuffle}
                disabled={shuffleCount <= 0}
              >
                🔄 洗牌 ({shuffleCount})
              </Button>
              <Button
                className={`${styles.button} ${styles.secondary}`}
                onClick={handleRestart}
              >
                🎯 重新开始
              </Button>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export default Game;

export const onShareAppMessage = () => {
  console.log('[onShareAppMessage] 被调用！');
  try {
    const timestamp = Date.now();
    console.log('[onShareAppMessage] 保存分享状态到本地存储，timestamp:', timestamp);
    Taro.setStorageSync(SHARE_STORAGE_KEY, timestamp);
    console.log('[onShareAppMessage] setHasSharedRef 是否存在:', !!setHasSharedRef);
    if (setHasSharedRef) {
      console.log('[onShareAppMessage] 调用 setHasSharedRef(true)');
      setHasSharedRef(true);
    } else {
      console.warn('[onShareAppMessage] setHasSharedRef 为 null，无法直接更新状态！');
    }
    Taro.showToast({
      title: '分享成功！',
      icon: 'success',
      duration: 1000
    });
  } catch (e) {
    console.error('保存分享状态失败:', e);
  }
  return {
    title: '🐕 狗了个狗 - 超好玩的消除游戏！',
    path: '/pages/index/index',
    imageUrl: ''
  };
};

export const onShareTimeline = () => {
  console.log('[onShareTimeline] 被调用！');
  try {
    const timestamp = Date.now();
    console.log('[onShareTimeline] 保存分享状态到本地存储，timestamp:', timestamp);
    Taro.setStorageSync(SHARE_STORAGE_KEY, timestamp);
    console.log('[onShareTimeline] setHasSharedRef 是否存在:', !!setHasSharedRef);
    if (setHasSharedRef) {
      console.log('[onShareTimeline] 调用 setHasSharedRef(true)');
      setHasSharedRef(true);
    } else {
      console.warn('[onShareTimeline] setHasSharedRef 为 null，无法直接更新状态！');
    }
    Taro.showToast({
      title: '分享成功！',
      icon: 'success',
      duration: 1000
    });
  } catch (e) {
    console.error('保存分享状态失败:', e);
  }
  return {
    title: '🐕 狗了个狗 - 超好玩的消除游戏！',
    query: '',
    imageUrl: ''
  };
};
