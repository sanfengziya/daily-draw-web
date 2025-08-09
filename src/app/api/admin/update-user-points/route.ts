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

export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const body = await request.json();
    const { userId, points } = body;

    // 验证输入
    if (!userId || typeof points !== 'number' || points < 0) {
      return NextResponse.json(
        { error: '无效的用户ID或积分数值' },
        { status: 400 }
      );
    }

    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    
    // 开始事务
    await connection.beginTransaction();

    try {
      // 检查用户是否存在
      const [userRows] = await connection.execute(
        'SELECT id, username FROM users WHERE id = ?',
        [userId]
      );

      if (!Array.isArray(userRows) || userRows.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }

      // 更新用户积分
      await connection.execute(
        'UPDATE users SET points = ? WHERE id = ?',
        [points, userId]
      );

      // 获取更新后的用户信息
      const [updatedRows] = await connection.execute(
        'SELECT id, username, points FROM users WHERE id = ?',
        [userId]
      );

      if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: '获取更新后用户信息失败' },
          { status: 500 }
        );
      }

      // 提交事务
      await connection.commit();

      const updatedUser = updatedRows[0];

      return NextResponse.json({
        success: true,
        message: '积分更新成功',
        user: updatedUser
      });

    } catch (transactionError) {
      // 回滚事务
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('更新用户积分错误:', error);
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