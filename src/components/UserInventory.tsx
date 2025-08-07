'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserCard } from '@/types/user';

interface UserInventoryProps {
  uid: string;
}

export default function UserInventory({ uid }: UserInventoryProps) {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/inventory?uid=${uid}`);
      const data = await response.json();

      if (data.success) {
        setCards(data.cards);
      } else {
        setError(data.message || '获取库存失败');
      }
    } catch (error) {
      console.error('获取库存错误:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toUpperCase()) {
      case 'N': return 'text-gray-600 bg-gray-100';
      case 'R': return 'text-blue-600 bg-blue-100';
      case 'SR': return 'text-purple-600 bg-purple-100';
      case 'SSR': return 'text-yellow-600 bg-yellow-100';
      case 'UR': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const generateStars = (stars: number) => {
    return Array.from({ length: stars }, (_, i) => (
      <span key={i} className="text-yellow-400">★</span>
    ));
  };

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchInventory}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">我的卡片库存</h2>
      
      {cards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">您还没有任何卡片</p>
          <p className="text-sm">快去抽卡获得您的第一张卡片吧！</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            总计: {cards.length} 张卡片
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 truncate">{card.card_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(card.card_rarity)}`}>
                    {card.card_rarity}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>卡片ID: {card.card_id}</p>
                  <div className="flex items-center gap-1">
                    <span>星级:</span>
                    <div className="flex">{generateStars(card.stars)}</div>
                    <span>({card.stars}星)</span>
                  </div>
                  <p>获得时间: {new Date(card.obtained_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}