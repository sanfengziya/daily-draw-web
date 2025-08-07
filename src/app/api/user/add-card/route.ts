import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daily_draw',
  port: parseInt(process.env.DB_PORT || '3306')
};

interface AddCardRequest {
  uid: string;
  card_id: string;
  card_name: string;
  card_rarity: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AddCardRequest = await request.json();
    const { uid, card_id, card_name, card_rarity } = body;

    if (!uid || !card_id || !card_name || !card_rarity) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数'
      }, { status: 400 });
    }

    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);

    try {
      // 添加卡片到用户库存
      await connection.execute(
        'INSERT INTO user_cards (uid, card_id, card_name, card_rarity) VALUES (?, ?, ?, ?)',
        [uid, card_id, card_name, card_rarity]
      );

      return NextResponse.json({
        success: true,
        message: '卡片添加成功'
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('添加卡片错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器错误，请稍后重试'
    }, { status: 500 });
  }
}