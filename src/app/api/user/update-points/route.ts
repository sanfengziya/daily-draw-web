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

interface UpdatePointsRequest {
  uid: string;
  points: number; // 要扣除的积分数量（正数表示扣除，负数表示增加）
  operation: 'deduct' | 'add'; // 操作类型
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdatePointsRequest = await request.json();
    const { uid, points, operation } = body;

    if (!uid || points === undefined || !operation) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数'
      }, { status: 400 });
    }

    if (points < 0) {
      return NextResponse.json({
        success: false,
        message: '积分数量不能为负数'
      }, { status: 400 });
    }

    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);

    try {
      // 开始事务
      await connection.beginTransaction();

      // 获取当前用户积分
      const [userRows] = await connection.execute(
        'SELECT points FROM users WHERE user_id = ?',
        [uid]
      );
      
      const users = userRows as Array<{ points: number }>;
      
      if (users.length === 0) {
        await connection.rollback();
        return NextResponse.json({
          success: false,
          message: '用户不存在'
        }, { status: 404 });
      }

      const currentPoints = users[0].points;
      let newPoints: number;

      if (operation === 'deduct') {
        // 检查积分是否足够
        if (currentPoints < points) {
          await connection.rollback();
          return NextResponse.json({
            success: false,
            message: '积分不足',
            currentPoints,
            requiredPoints: points
          }, { status: 400 });
        }
        newPoints = currentPoints - points;
      } else {
        // 增加积分
        newPoints = currentPoints + points;
      }

      // 更新用户积分
      await connection.execute(
        'UPDATE users SET points = ? WHERE user_id = ?',
        [newPoints, uid]
      );

      // 提交事务
      await connection.commit();

      return NextResponse.json({
        success: true,
        message: operation === 'deduct' ? '积分扣除成功' : '积分增加成功',
        previousPoints: currentPoints,
        newPoints,
        pointsChanged: points
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('更新积分错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器错误，请稍后重试'
    }, { status: 500 });
  }
}