import { PullResult, Rarity, Card, StarRates } from '../types/card';
import { fetchAllCards, groupCardsByRarity } from '../services/cardService';

// 全局卡片缓存
let cardCache: Record<Rarity, Card[]> | null = null;

// 稀有度概率配置
const rarityRates = {
  UR: 0.0001,  // 0.01%
  SSR: 0.0099, // 0.99%
  SR: 0.10,    // 10%
  R: 0.30,     // 30%
  N: 0.59      // 59%
};

// 星级概率配置
const starRates: Record<Rarity, StarRates> = {
  UR: {
    6: 0.001,  // 6 stars - 0.1%
    5: 0.004,  // 5 stars - 0.4%
    4: 0.015,  // 4 stars - 1.5%
    3: 0.18,   // 3 stars - 18%
    2: 0.40,   // 2 stars - 40%
    1: 0.40    // 1 star  - 40%
  },
  SSR: {
    6: 0.002,  // 6 stars - 0.2%
    5: 0.008,  // 5 stars - 0.8%
    4: 0.03,   // 4 stars - 3%
    3: 0.16,   // 3 stars - 16%
    2: 0.40,   // 2 stars - 40%
    1: 0.40    // 1 star  - 40%
  },
  SR: {
    6: 0.005,  // 6 stars - 0.5%
    5: 0.015,  // 5 stars - 1.5%
    4: 0.08,   // 4 stars - 8%
    3: 0.20,   // 3 stars - 20%
    2: 0.35,   // 2 stars - 35%
    1: 0.35    // 1 star  - 35%
  },
  R: {
    6: 0.01,   // 6 stars - 1%
    5: 0.03,   // 5 stars - 3%
    4: 0.11,   // 4 stars - 11%
    3: 0.25,   // 3 stars - 25%
    2: 0.30,   // 2 stars - 30%
    1: 0.30    // 1 star  - 30%
  },
  N: {
    6: 0,    // 6 stars - 0%
    5: 0,    // 5 stars - 0%
    4: 0,    // 4 stars - 0%
    3: 0.05, // 3 stars - 5%
    2: 0.35, // 2 stars - 35%
    1: 0.60  // 1 star  - 60%
  }
};

// 初始化卡片数据
export async function initializeCards(): Promise<void> {
  if (cardCache) return; // 已经初始化过了
  
  try {
    const allCards = await fetchAllCards();
    cardCache = groupCardsByRarity(allCards);
  } catch (error) {
    console.error('初始化卡片数据失败:', error);
    // 如果数据库获取失败，使用默认数据
    cardCache = {
      UR: [],
      SSR: [],
      SR: [],
      R: [],
      N: []
    };
  }
}

// 获取卡片缓存
export function getCardCache(): Record<Rarity, Card[]> {
  if (!cardCache) {
    throw new Error('卡片数据未初始化，请先调用 initializeCards()');
  }
  return cardCache;
}

// 抽取星级
export function pullStars(rarity: Rarity): number {
  const random = Math.random();
  let sum = 0;
  const rates = starRates[rarity];
  
  for (const stars in rates) {
    sum += rates[parseInt(stars)];
    if (random < sum) {
      return parseInt(stars);
    }
  }
  return 1; // 默认1星
}

// 抽卡函数
export function pullCard(): PullResult {
  const cards = getCardCache();
  const random = Math.random();
  let selectedRarity: Rarity;
  let cumulativeRate = 0;

  // 按概率选择稀有度
  if (random < (cumulativeRate += rarityRates.UR)) {
    selectedRarity = 'UR';
  } else if (random < (cumulativeRate += rarityRates.SSR)) {
    selectedRarity = 'SSR';
  } else if (random < (cumulativeRate += rarityRates.SR)) {
    selectedRarity = 'SR';
  } else if (random < (cumulativeRate += rarityRates.R)) {
    selectedRarity = 'R';
  } else {
    selectedRarity = 'N';
  }

  // 从对应稀有度的卡片中随机选择
  const pool = cards[selectedRarity];
  if (pool.length === 0) {
    // 如果该稀有度没有卡片，降级到下一个稀有度
    const fallbackRarities: Rarity[] = ['N', 'R', 'SR', 'SSR', 'UR'];
    for (const fallbackRarity of fallbackRarities) {
      if (cards[fallbackRarity].length > 0) {
        selectedRarity = fallbackRarity;
        break;
      }
    }
  }
  
  const finalPool = cards[selectedRarity];
  if (finalPool.length === 0) {
    throw new Error('没有可用的卡片数据');
  }
  
  const card = finalPool[Math.floor(Math.random() * finalPool.length)];
  const stars = pullStars(selectedRarity);
  
  return { ...card, stars };
}

// 生成星星显示
export function generateStars(count: number): string {
  return '★'.repeat(count) + '☆'.repeat(6 - count);
}

// 获取最高稀有度
export function getHighestRarity(cards: PullResult[]): Rarity {
  const rarityOrder: Rarity[] = ['N', 'R', 'SR', 'SSR', 'UR'];
  return cards.reduce((highest, card) => {
    const currentIndex = rarityOrder.indexOf(card.rarity);
    const highestIndex = rarityOrder.indexOf(highest);
    return currentIndex > highestIndex ? card.rarity : highest;
  }, 'N' as Rarity);
}

// 睡眠函数
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));