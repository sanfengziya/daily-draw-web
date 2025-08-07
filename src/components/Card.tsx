'use client';

import { PullResult } from '../types/card';
import { generateStars } from '../utils/gacha';
import Image from 'next/image';

interface CardProps {
  card: PullResult;
  isRevealed?: boolean;
}

export default function Card({ card, isRevealed = false }: CardProps) {
  return (
    <div 
      className={`
        card ${card.rarity.toLowerCase()}
        ${isRevealed ? 'card-reveal' : ''}
      `}
      data-stars={card.stars}
    >
      <Image
        src={card.image}
        alt={card.name}
        fill
        className="card-image"
        sizes="180px"
      />
      <div className="card-info">
        <h3>{card.name}</h3>
        <p className="anime-name">{card.anime}</p>
        <p className="stars">{generateStars(card.stars)}</p>
        <p>Rarity: {card.rarity}</p>
      </div>
    </div>
  );
}