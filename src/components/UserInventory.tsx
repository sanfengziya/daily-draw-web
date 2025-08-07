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
  const [filterType, setFilterType] = useState<'stars' | 'rarity' | ''>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [availableStars, setAvailableStars] = useState<number[]>([]);
  const [availableRarities, setAvailableRarities] = useState<string[]>([]);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/user/inventory?uid=${uid}`;
      if (filterType && filterValue) {
        url += `&filterType=${filterType}&filterValue=${filterValue}`;
      }
      
      const response = await fetch(url);
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
  }, [uid, filterType, filterValue]);

  // 获取所有可用的星级和稀有度选项
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch(`/api/user/inventory?uid=${uid}`);
      const data = await response.json();
      
      if (data.success) {
        const starsSet = new Set<number>(data.cards.map((card: UserCard) => card.stars));
        const stars = Array.from(starsSet).sort((a: number, b: number) => a - b);
        const rarities = [...new Set(data.cards.map((card: UserCard) => card.card_rarity))] as string[];
        setAvailableStars(stars);
        setAvailableRarities(rarities);
      }
    } catch (error) {
      console.error('获取筛选选项错误:', error);
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

  // 处理筛选器变化
  const handleFilterChange = (type: 'stars' | 'rarity' | '', value: string) => {
    setFilterType(type);
    setFilterValue(value);
  };

  // 重置筛选器
  const resetFilter = () => {
    setFilterType('');
    setFilterValue('');
  };

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

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
      
      {/* 筛选器 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">筛选类型:</label>
            <select 
              value={filterType} 
              onChange={(e) => handleFilterChange(e.target.value as 'stars' | 'rarity' | '', '')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="">全部</option>
              <option value="stars">按星级</option>
              <option value="rarity">按稀有度</option>
            </select>
          </div>
          
          {filterType === 'stars' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">星级:</label>
              <select 
                value={filterValue} 
                onChange={(e) => handleFilterChange('stars', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="">选择星级</option>
                {availableStars.map(star => (
                  <option key={star} value={star.toString()}>{star}星</option>
                ))}
              </select>
            </div>
          )}
          
          {filterType === 'rarity' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">稀有度:</label>
              <select 
                value={filterValue} 
                onChange={(e) => handleFilterChange('rarity', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="">选择稀有度</option>
                {availableRarities.map(rarity => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
            </div>
          )}
          
          {(filterType && filterValue) && (
            <button 
              onClick={resetFilter}
              className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
            >
              重置筛选
            </button>
          )}
        </div>
      </div>
      
      {cards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">您还没有任何卡片</p>
          <p className="text-sm">快去抽卡获得您的第一张卡片吧！</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            总计: {cards.reduce((total, card) => total + (card.count || 1), 0)} 张卡片 ({cards.length} 种不同卡片)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
                {/* 堆叠数量显示 */}
                {card.count && card.count > 1 && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                    x{card.count}
                  </div>
                )}
                
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