'use client';

import { useState, useEffect } from 'react';
import { Rarity } from '../types/card';
import { sleep } from '../utils/gacha';
import { getRandomCardPackImage } from '../utils/cardPack';
import Image from 'next/image';

interface CardPackProps {
  isVisible: boolean;
  highestRarity: Rarity;
  onPackOpened: () => void;
}

export default function CardPack({ isVisible, highestRarity, onPackOpened }: CardPackProps) {
  const [clickCount, setClickCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [showLight, setShowLight] = useState(false);
  const [packImage, setPackImage] = useState<string>('');
  const maxClicks = 3;

  // 每次显示卡包时随机选择图片
  useEffect(() => {
    if (isVisible) {
      const loadPackImage = async () => {
        try {
          const image = await getRandomCardPackImage();
          setPackImage(image);
        } catch (error) {
          console.error('加载卡包图片失败:', error);
          setPackImage('/card_packs/chiikawa.png'); // 使用默认图片
        }
      };
      
      loadPackImage();
    }
  }, [isVisible]);

  const handlePackClick = async () => {
    if (isOpening) return;

    // 震动动画
    setIsShaking(true);
    await sleep(500);
    setIsShaking(false);

    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    if (newClickCount === maxClicks) {
      setIsOpening(true);
      
      // 添加稀有度光效
      setShowLight(true);
      await sleep(1000);

      // 开包动画
      await sleep(500);

      // 重置状态并通知父组件
      setClickCount(0);
      setIsShaking(false);
      setIsOpening(false);
      setShowLight(false);
      onPackOpened();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="card-pack-container">
      <div 
        className={`
          card-pack
          ${isShaking ? 'pack-shake' : ''}
          ${isOpening ? 'pack-open' : ''}
          ${showLight ? `pack-${highestRarity.toLowerCase()}-light` : ''}
        `}
        onClick={handlePackClick}
      >
        <div className="pack-front">
          {packImage && (
            <Image
              src={packImage}
              alt="卡包封面"
              fill
              className="pack-image"
              style={{ objectFit: 'cover', borderRadius: '20px' }}
              sizes="300px"
            />
          )}
          <div className="pack-stars"></div>
        </div>
        <div className="pack-light"></div>
      </div>
      <div className="pack-instruction">
        点击开包！({clickCount}/{maxClicks})
      </div>
    </div>
  );
}