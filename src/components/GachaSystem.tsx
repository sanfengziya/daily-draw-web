'use client';

import { useState, useEffect } from 'react';
import { PullResult } from '../types/card';
import { AppUser } from '../types/user';
import { pullCard, getHighestRarity, sleep, initializeCards } from '../utils/gacha';
import Card from './Card';
import CardPack from './CardPack';

interface GachaSystemProps {
  user: AppUser;
  onUserUpdate: (updatedUser: AppUser) => void; // 用于更新用户信息的回调
}

export default function GachaSystem({ user, onUserUpdate }: GachaSystemProps) {
  const [results, setResults] = useState<PullResult[]>([]);
  const [isPackVisible, setIsPackVisible] = useState(false);
  const [currentCards, setCurrentCards] = useState<PullResult[]>([]);
  const [revealedCards, setRevealedCards] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // 处理抽卡中的状态

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

  // 扣除用户积分
  const deductPoints = async (points: number) => {
    try {
      const response = await fetch('/api/user/update-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.user_id,
          points,
          operation: 'deduct'
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '积分扣除失败');
      }
      
      // 更新用户积分
      const updatedUser = { ...user, points: result.newPoints };
      onUserUpdate(updatedUser);
      
      return result;
    } catch (error) {
      console.error('扣除积分失败:', error);
      throw error;
    }
  };

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
    const requiredPoints = 120;
    
    // 检查积分是否足够
    if (user.points < requiredPoints) {
      alert(`积分不足！单抽需要 ${requiredPoints} 积分，您当前有 ${user.points} 积分。`);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 先扣除积分
      await deductPoints(requiredPoints);
      
      // 抽卡
      const card = pullCard();
      setCurrentCards([card]);
      setIsPackVisible(true);
      
      // 保存到数据库
      await saveCardsToDatabase([card]);
    } catch (error) {
      console.error('单抽失败:', error);
      alert('抽卡失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTenPull = async () => {
    const requiredPoints = 1200;
    
    // 检查积分是否足够
    if (user.points < requiredPoints) {
      alert(`积分不足！十连抽需要 ${requiredPoints} 积分，您当前有 ${user.points} 积分。`);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 先扣除积分
      await deductPoints(requiredPoints);
      
      // 抽卡
      const cards = Array.from({ length: 10 }, () => pullCard());
      setCurrentCards(cards);
      setIsPackVisible(true);
      
      // 保存到数据库
      await saveCardsToDatabase(cards);
    } catch (error) {
      console.error('十连抽失败:', error);
      alert('抽卡失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
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
          disabled={isPackVisible || isProcessing || user.points < 120}
        >
          <span className="button-icon">⭐</span>
          <span>单抽 (120积分)</span>
        </button>
        <button 
          className="pull-button ten-pull"
          onClick={handleTenPull}
          disabled={isPackVisible || isProcessing || user.points < 1200}
        >
          <span className="button-icon">✨</span>
          <span>十连抽 (1200积分)</span>
        </button>
      </div>
      
      {/* 用户积分显示 */}
      <div className="points-display">
        <span className="points-label">当前积分:</span>
        <span className="points-value">{user.points}</span>
      </div>
    </div>
  );
}