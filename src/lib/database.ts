import mysql from 'mysql2/promise';
import {DbCard} from '@/types/card';

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daily_draw',
  port: parseInt(process.env.DB_PORT || '3306'),
};

// 测试数据库连接
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// 创建数据库连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 获取所有卡片
export async function getAllCards(): Promise<DbCard[]> {
  try {
    const [rows] = await pool.execute('SELECT * FROM card');
    return rows as DbCard[];
  } catch (error) {
    console.error('获取卡片数据失败:', error);
    throw new Error('数据库查询失败');
  }
}

// 根据稀有度获取卡片
export async function getCardsByRarity(rarity: string): Promise<DbCard[]> {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM card WHERE rarity = ?',
      [rarity.toLowerCase()]
    );
    return rows as DbCard[];
  } catch (error) {
    console.error('根据稀有度获取卡片失败:', error);
    throw new Error('数据库查询失败');
  }
}

export default pool;