import { NextResponse } from 'next/server';
import { getAllCards, getCardsByRarity } from '@/lib/database';

// GET /api/cards - 获取所有卡片或按稀有度筛选
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rarity = searchParams.get('rarity');

    let cards;
    if (rarity) {
      cards = await getCardsByRarity(rarity);
    } else {
      cards = await getAllCards();
    }

    return NextResponse.json({
      success: true,
      data: cards,
    });
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取卡片数据失败',
      },
      { status: 500 }
    );
  }
}