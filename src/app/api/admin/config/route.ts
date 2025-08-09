import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 从环境变量读取管理员用户ID列表
const getAdminUserIds = (): string[] => {
  const adminIds = process.env.ADMIN_USER_ID;
  if (!adminIds) {
    console.warn('未设置ADMIN_USER_ID环境变量');
    return [];
  }
  // 支持逗号分隔的多个管理员ID
  return adminIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
};

export async function GET(request: NextRequest) {
  try {
    // 获取JWT token验证用户身份
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token || !token.sub) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const userId = token.sub;
    const adminUserIds = getAdminUserIds();
    const isAdmin = adminUserIds.includes(userId);

    return NextResponse.json({
      success: true,
      isAdmin,
      userId,
      adminUserIds: isAdmin ? adminUserIds : [] // 只有管理员才能看到完整的管理员列表
    });

  } catch (error) {
    console.error('获取管理员配置错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}