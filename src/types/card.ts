// 卡片稀有度类型
export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

// 数据库卡片接口
export interface DbCard {
  id: number;
  anime: string;
  character: string;
  rarity: string;
}

// 卡片接口
export interface Card {
  id: number;
  name: string;
  anime: string;
  rarity: Rarity;
  image: string;
  stars?: number;
}

// 星级概率配置接口
export interface StarRates {
  [stars: number]: number;
}

// 抽卡结果接口
export interface PullResult extends Card {
  stars: number;
}