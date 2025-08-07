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
    const filterType = searchParams.get('filterType'); // 'stars' | 'rarity' | null
    const filterValue = searchParams.get('filterValue'); // 具体的星级或稀有度值

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
      // 构建查询条件
      let whereClause = 'WHERE uid = ?';
      const queryParams: (string | number)[] = [uid];
      
      if (filterType === 'stars' && filterValue) {
        whereClause += ' AND stars = ?';
        queryParams.push(parseInt(filterValue));
      } else if (filterType === 'rarity' && filterValue) {
        whereClause += ' AND card_rarity = ?';
        queryParams.push(filterValue);
      }
      
      // 查询用户的卡片库存，按卡片ID和星级分组以实现堆叠
      const [rows] = await connection.execute(
        `SELECT 
          MIN(id) as id,
          uid, 
          card_id, 
          card_name, 
          card_rarity, 
          stars, 
          COUNT(*) as count,
          MAX(obtained_at) as obtained_at 
        FROM user_cards 
        ${whereClause} 
        GROUP BY uid, card_id, card_name, card_rarity, stars 
        ORDER BY obtained_at DESC`,
        queryParams
      );

      const cards = rows as Array<{
        id: number;
        uid: string;
        card_id: number;
        card_name: string;
        card_rarity: string;
        stars: number;
        count: number;
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
          count: card.count,
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