import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { LoginRequest, LoginResponse } from '@/types/user';

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daily_draw',
  port: parseInt(process.env.DB_PORT || '3306')
};

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({
        success: false,
        message: '请输入用户ID'
      } as LoginResponse, { status: 400 });
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
        last_wheel: string | null;
        paid_draws_today: number;
        last_paid_draw_date: string | null;
      }>;

      if (users.length === 0) {
        // 用户不存在，创建新用户
        await connection.execute(
          'INSERT INTO users (user_id, points, paid_draws_today) VALUES (?, ?, ?)',
          [uid, 0, 0]
        );

        // 获取新创建的用户信息
        const [newUserRows] = await connection.execute(
          'SELECT * FROM users WHERE user_id = ?',
          [uid]
        );
        const newUsers = newUserRows as Array<{
          user_id: string;
          points: number;
          last_draw: string | null;
          last_wheel: string | null;
          paid_draws_today: number;
          last_paid_draw_date: string | null;
        }>;
        const user = newUsers[0];

        return NextResponse.json({
          success: true,
          user: {
            user_id: user.user_id.toString(),
            points: user.points,
            last_draw: user.last_draw,
            last_wheel: user.last_wheel,
            paid_draws_today: user.paid_draws_today,
            last_paid_draw_date: user.last_paid_draw_date
          },
          message: '新用户创建成功！'
        } as LoginResponse);
      } else {
        // 用户存在，返回用户信息
        const user = users[0];
        return NextResponse.json({
          success: true,
          user: {
            user_id: user.user_id.toString(),
            points: user.points,
            last_draw: user.last_draw,
            last_wheel: user.last_wheel,
            paid_draws_today: user.paid_draws_today,
            last_paid_draw_date: user.last_paid_draw_date
          },
          message: '登录成功！'
        } as LoginResponse);
      }
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器错误，请稍后重试'
    } as LoginResponse, { status: 500 });
  }
}