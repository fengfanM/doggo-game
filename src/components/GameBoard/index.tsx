import React from 'react';
import { View } from '@tarojs/components';
import GameCard from '@/components/GameCard';
import { Card } from '@/types/game';
import styles from './index.module.scss';

interface GameBoardProps {
  cards: Card[];
  queue: Card[];
  sortedQueue: Record<string, number>;
  onCardClick: (cardId: string) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ cards, queue, sortedQueue, onCardClick }) => {
  return (
    <View className={styles.board}>
      {cards.map((card) => {
        if (card.status !== 0) {
          return null;
        }

        const x = card.x + 50;
        const y = card.y + 50;

        return (
          <GameCard
            key={card.id}
            card={card}
            onClick={onCardClick}
            x={x}
            y={y}
            zIndex={card.zIndex}
          />
        );
      })}
    </View>
  );
};

export default GameBoard;
