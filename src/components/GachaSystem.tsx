'use client';

import { useState, useEffect } from 'react';
import { PullResult } from '../types/card';
import { AppUser } from '../types/user';
import { pullCard, getHighestRarity, sleep, initializeCards } from '../utils/gacha';
import Card from './Card';
import CardPack from './CardPack';

interface GachaSystemProps {
  user: AppUser;
}

export default function GachaSystem({ user }: GachaSystemProps) {
  const [results, setResults] = useState<PullResult[]>([]);
  const [isPackVisible, setIsPackVisible] = useState(false);
  const [currentCards, setCurrentCards] = useState<PullResult[]>([]);
  const [revealedCards, setRevealedCards] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化卡片数据
  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoading(true);
        await initializeCards();
        setError(null);
      } catch (err) {
        console.error('初始化卡片数据失败:', err);
        setError('加载卡片数据失败，请刷新页面重试');
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, []);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="gacha-system">
        <div className="title-section">
          <h1 className="gacha-title">加载中...</h1>
        </div>
      </div>
    );
  }

  // 如果加载失败，显示错误信息
  if (error) {
    return (
      <div className="gacha-system">
        <div className="title-section">
          <h1 className="gacha-title">错误</h1>
          <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
        </div>
      </div>
    );
  }

  // 保存抽卡结果到数据库
  const saveCardsToDatabase = async (cards: PullResult[]) => {
    try {
      for (const card of cards) {
        await fetch('/api/user/add-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.user_id,
            card_id: card.id.toString(),
            card_name: card.name,
            card_rarity: card.rarity,
            stars: card.stars
          }),
        });
      }
    } catch (error) {
      console.error('保存卡片到数据库失败:', error);
    }
  };

  const handleSinglePull = async () => {
    const card = pullCard();
    setCurrentCards([card]);
    setIsPackVisible(true);
    // 保存到数据库
    await saveCardsToDatabase([card]);
  };

  const handleTenPull = async () => {
    const cards = Array.from({ length: 10 }, () => pullCard());
    setCurrentCards(cards);
    setIsPackVisible(true);
    // 保存到数据库
    await saveCardsToDatabase(cards);
  };

  const handlePackOpened = async () => {
    setIsPackVisible(false);
    setResults(currentCards);
    setRevealedCards(new Array(currentCards.length).fill(false));

    // 逐个显示卡片
    for (let i = 0; i < currentCards.length; i++) {
      await sleep(200);
      setRevealedCards(prev => {
        const newRevealed = [...prev];
        newRevealed[i] = true;
        return newRevealed;
      });
    }
  };

  const highestRarity = currentCards.length > 0 ? getHighestRarity(currentCards) : 'R';

  return (
    <div className="gacha-system">
      {/* 标题 */}
      <div className="title-section">
        <h1 className="gacha-title">
          抽卡系统
        </h1>
      </div>

      {/* 卡片结果区域 */}
      <div className="results-area">
        {results.map((card, index) => (
          <Card 
            key={`${card.name}-${index}`} 
            card={card} 
            isRevealed={revealedCards[index]}
          />
        ))}
      </div>

      {/* 卡包组件 */}
      <CardPack 
        isVisible={isPackVisible}
        highestRarity={highestRarity}
        onPackOpened={handlePackOpened}
      />

      {/* 抽卡按钮 */}
      <div className="buttons-section">
        <button 
          className="pull-button single-pull"
          onClick={handleSinglePull}
          disabled={isPackVisible}
        >
          <span className="button-icon">⭐</span>
          <span>单抽</span>
        </button>
        <button 
          className="pull-button ten-pull"
          onClick={handleTenPull}
          disabled={isPackVisible}
        >
          <span className="button-icon">✨</span>
          <span>十连抽</span>
        </button>
      </div>
    </div>
  );
}