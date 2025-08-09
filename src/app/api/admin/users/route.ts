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
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    
    // 获取所有用户
    const [rows] = await connection.execute(
      'SELECT user_id as id, user_id as username, points, last_draw as created_at FROM users ORDER BY last_draw DESC'
    ) as [any[], any];  return NextResponse.json({
      success: true,
      users: rows,
      total: Array.isArray(rows) ? rows.length : 0
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}