import { NextRequest, NextResponse } from 'next/server';

// Discord OAuth登录路由
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json({
        success: false,
        message: 'Discord配置缺失'
      }, { status: 500 });
    }

    // 构建Discord OAuth授权URL
    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
    discordAuthUrl.searchParams.set('client_id', clientId);
    discordAuthUrl.searchParams.set('redirect_uri', redirectUri);
    discordAuthUrl.searchParams.set('response_type', 'code');
    discordAuthUrl.searchParams.set('scope', 'identify');
    discordAuthUrl.searchParams.set('state', 'discord_login'); // 可以用于防CSRF

    // 重定向到Discord授权页面
    return NextResponse.redirect(discordAuthUrl.toString());
  } catch (error) {
    console.error('Discord OAuth错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器错误，请稍后重试'
    }, { status: 500 });
  }
}