import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { UserInventoryResponse } from '@/types/user';

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daily_draw',
  port: parseInt(process.env.DB_PORT || '3306')
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({
        success: false,
        cards: [],
        message: '请提供用户ID'
      } as UserInventoryResponse, { status: 400 });
    }

    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);

    try {
      // 查询用户的卡片库存
      const [rows] = await connection.execute(
        'SELECT id, uid, card_id, card_name, card_rarity, stars, obtained_at FROM user_cards WHERE uid = ? ORDER BY obtained_at DESC',
        [uid]
      );

      const cards = rows as Array<{
        id: number;
        uid: string;
        card_id: number;
        card_name: string;
        card_rarity: string;
        stars: number;
        obtained_at: string;
      }>;

      return NextResponse.json({
        success: true,
        cards: cards.map(card => ({
          id: card.id,
          uid: card.uid,
          card_id: card.card_id.toString(),
          card_name: card.card_name,
          card_rarity: card.card_rarity,
          stars: card.stars,
          obtained_at: card.obtained_at
        })),
        message: '库存获取成功'
      } as UserInventoryResponse);
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('获取库存错误:', error);
    return NextResponse.json({
      success: false,
      cards: [],
      message: '服务器错误，请稍后重试'
    } as UserInventoryResponse, { status: 500 });
  }
}