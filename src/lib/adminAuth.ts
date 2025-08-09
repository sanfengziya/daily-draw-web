import { NextRequest } from 'next/server';
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

const ADMIN_USER_IDS = getAdminUserIds();

/**
 * 验证用户是否为管理员
 * @param request NextRequest对象
 * @returns Promise<{isAdmin: boolean, userId?: string, error?: string}>
 */
export async function verifyAdminAccess(request: NextRequest) {
  try {
    // 获取JWT token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token || !token.sub) {
      return {
        isAdmin: false,
        error: '未登录或token无效'
      };
    }

    const userId = token.sub;
    const isAdmin = ADMIN_USER_IDS.includes(userId);

    if (!isAdmin) {
      return {
        isAdmin: false,
        userId,
        error: '权限不足，非管理员用户'
      };
    }

    return {
      isAdmin: true,
      userId
    };

  } catch (error) {
    console.error('管理员权限验证错误:', error);
    return {
      isAdmin: false,
      error: '权限验证失败'
    };
  }
}

/**
 * 管理员权限中间件
 * @param request NextRequest对象
 * @returns Promise<NextResponse | null> 如果返回NextResponse则表示权限验证失败，应该直接返回；如果返回null则表示验证通过
 */
export async function adminAuthMiddleware(request: NextRequest) {
  const authResult = await verifyAdminAccess(request);
  
  if (!authResult.isAdmin) {
    const { NextResponse } = await import('next/server');
    return NextResponse.json(
      { 
        error: authResult.error || '权限不足',
        code: 'UNAUTHORIZED'
      },
      { status: 403 }
    );
  }
  
  return null; // 验证通过
}