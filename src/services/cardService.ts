import { DbCard, Card, Rarity } from '@/types/card';

// 将数据库卡片转换为前端卡片格式
export function convertDbCardToCard(dbCard: DbCard): Card {
  return {
    id: dbCard.id,
    name: dbCard.character,
    anime: dbCard.anime,
    rarity: dbCard.rarity.toUpperCase() as Rarity,
    image: `/images/${dbCard.rarity.toLowerCase()}/${dbCard.character}-${dbCard.rarity.toUpperCase()}.png`,
  };
}

// 从API获取所有卡片
export async function fetchAllCards(): Promise<Card[]> {
  try {
    const response = await fetch('/api/cards');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '获取卡片失败');
    }
    
    return result.data.map(convertDbCardToCard);
  } catch (error) {
    console.error('获取卡片数据失败:', error);
    throw error;
  }
}

// 从API获取指定稀有度的卡片
export async function fetchCardsByRarity(rarity: string): Promise<Card[]> {
  try {
    const response = await fetch(`/api/cards?rarity=${rarity}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '获取卡片失败');
    }
    
    return result.data.map(convertDbCardToCard);
  } catch (error) {
    console.error('获取指定稀有度卡片失败:', error);
    throw error;
  }
}

// 按稀有度分组卡片
export function groupCardsByRarity(cards: Card[]): Record<Rarity, Card[]> {
  const grouped: Record<Rarity, Card[]> = {
    N: [],
    R: [],
    SR: [],
    SSR: [],
    UR: [],
  };
  
  cards.forEach(card => {
    if (grouped[card.rarity]) {
      grouped[card.rarity].push(card);
    }
  });
  
  return grouped;
}