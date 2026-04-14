import React from 'react';
import { View, Text } from '@tarojs/components';
import { Card as CardType } from '@/types/game';
import styles from './index.module.scss';

interface GameCardProps {
  card: CardType;
  onClick?: (cardId: string) => void;
  x?: number;
  y?: number;
  zIndex?: number;
  small?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ card, onClick, x, y, zIndex, small = false }) => {
  const handleClick = () => {
    if (!card.isCover && card.status === 0 && onClick) {
      onClick(card.id);
    }
  };

  const displayX = x !== undefined ? x : card.x;
  const displayY = y !== undefined ? y : card.y;
  const finalZIndex = zIndex !== undefined ? zIndex + 10 : 1000 - displayY;

  const classList = [styles.card];
  if (card.isCover) classList.push(styles.cover);
  if (small) classList.push(styles.small);
  if (card.status === 1 && !small) classList.push(styles.clicked);
  if (card.status === 2) classList.push(styles.eliminated);

  return (
    <View
      className={classList.join(' ')}
      style={small ? {
        opacity: card.status === 2 ? 0 : 1,
        transform: card.status === 2 ? 'scale(0) rotate(180deg)' : 'scale(1) rotate(0deg)'
      } : {
        left: `${displayX}rpx`,
        top: `${displayY}rpx`,
        opacity: card.status === 2 ? 0 : 1,
        transform: card.status === 2 ? 'scale(0) rotate(180deg)' : 'scale(1) rotate(0deg)',
        zIndex: finalZIndex
      }}
      onClick={handleClick}
    >
      <Text>{card.emoji}</Text>
    </View>
  );
};

export default GameCard;
