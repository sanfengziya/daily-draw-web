// 用户接口
export interface User {
  user_id: string;
  points: number;
  last_draw: string | null;
  last_wheel: string | null;
  paid_draws_today: number;
  last_paid_draw_date: string | null;
}

// 用户卡片接口
export interface UserCard {
  id: number;
  uid: string;
  card_id: string;
  card_name: string;
  card_rarity: string;
  stars: number;
  obtained_at: string;
  count?: number; // 堆叠数量，可选字段
}

// 登录请求接口
export interface LoginRequest {
  uid: string;
}

// 登录响应接口
export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

// 用户库存响应接口
export interface UserInventoryResponse {
  success: boolean;
  cards: UserCard[];
  message?: string;
}