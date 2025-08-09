import type { NextAuthOptions } from 'next-auth'
import type { User, Account, Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import DiscordProvider from 'next-auth/providers/discord'
import mysql from 'mysql2/promise'

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daily_draw',
  port: parseInt(process.env.DB_PORT || '3306')
};

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      if (account?.provider === 'discord' && user.id) {
        try {
          // 连接数据库
          const connection = await mysql.createConnection(dbConfig);
          
          try {
            // 查询用户是否存在
            const [rows] = await connection.execute(
              'SELECT * FROM users WHERE user_id = ?',
              [user.id]
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
                [user.id, 0, 0]
              );
              console.log(`新用户创建成功: ${user.id} (${user.name || user.email || 'Unknown'})`);
            }
            
            return true;
          } finally {
            await connection.end();
          }
        } catch (error) {
          console.error('数据库操作错误:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/', // 自定义登录页面
  },
  session: {
    strategy: 'jwt'
  }
};