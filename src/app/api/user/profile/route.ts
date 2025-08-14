import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
  port: parseInt(process.env.DB_PORT || '3306')
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { success: false, message: '缺少用户ID参数' },
        { status: 400 }
      );
    }

    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);

    try {
      // 查询用户是否存在
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE user_id = ?',
        [uid]
      );
      
      const users = rows as Array<{
        user_id: string;
        points: number;
        last_draw: string | null;
        paid_draws_today: number;
        last_paid_draw_date: string | null;
      }>;

      let user;
      if (users.length === 0) {
        // 用户不存在，创建新用户
        await connection.execute(
          'INSERT INTO users (user_id, points, last_draw, paid_draws_today, last_paid_draw_date) VALUES (?, ?, ?, ?, ?)',
          [uid, 0, null, 0, null]
        );
        
        // 获取新创建的用户数据
        const [newRows] = await connection.execute(
          'SELECT * FROM users WHERE user_id = ?',
          [uid]
        );
        
        const newUsers = newRows as Array<{
          user_id: string;
          points: number;
          last_draw: string | null;
          last_wheel: string | null;
          paid_draws_today: number;
          last_paid_draw_date: string | null;
        }>;
        
        user = newUsers[0];
        console.log(`新用户创建成功: ${uid}`);
      } else {
        user = users[0];
        console.log(`用户登录成功: ${uid}`);
      }

    return NextResponse.json({
        success: true,
        user: {
          user_id: user.user_id,
          points: user.points,
          last_draw: user.last_draw,
          paid_draws_today: user.paid_draws_today,
          last_paid_draw_date: user.last_paid_draw_date
        }
      });
    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('获取用户资料错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}