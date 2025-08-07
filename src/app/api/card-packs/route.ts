import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const cardPacksDir = path.join(process.cwd(), 'public', 'card_packs');
    
    // 检查目录是否存在
    if (!fs.existsSync(cardPacksDir)) {
      return NextResponse.json({ error: '卡包目录不存在' }, { status: 404 });
    }
    
    // 读取目录下的所有文件
    const files = fs.readdirSync(cardPacksDir);
    
    // 过滤出图片文件
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    });
    
    // 返回图片路径列表
    const imagePaths = imageFiles.map(file => `/card_packs/${file}`);
    
    return NextResponse.json({ images: imagePaths });
  } catch (error) {
    console.error('获取卡包图片失败:', error);
    return NextResponse.json({ error: '获取卡包图片失败' }, { status: 500 });
  }
}