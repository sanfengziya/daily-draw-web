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

// Discord用户信息接口
interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
}

// Discord OAuth回调处理
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // 检查是否有错误
    if (error) {
      console.error('Discord OAuth错误:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=discord_auth_failed`);
    }

    // 检查授权码
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=missing_code`);
    }

    // 验证state参数（防CSRF）
    if (state !== 'discord_login') {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=invalid_state`);
    }

    // 交换访问令牌
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('获取Discord令牌失败:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 获取用户信息
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error('获取Discord用户信息失败:', await userResponse.text());
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=user_info_failed`);
    }

    const discordUser: DiscordUser = await userResponse.json();
    const uid = discordUser.id;

    // 连接数据库并处理用户登录
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
        console.log(`新用户创建成功: ${uid} (${discordUser.username})`);
      }

      // 重定向到主页面，并传递用户ID
      const redirectUrl = new URL(process.env.NEXTAUTH_URL!);
      redirectUrl.searchParams.set('discord_login', 'success');
      redirectUrl.searchParams.set('uid', uid);
      redirectUrl.searchParams.set('username', discordUser.username);
      
      return NextResponse.redirect(redirectUrl.toString());
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Discord回调处理错误:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=callback_failed`);
  }
}