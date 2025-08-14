'use client';

import { signOut } from 'next-auth/react';
import { AppUser } from '@/types/user';
import { Session } from 'next-auth';

interface UserInfoProps {
  user: AppUser;
  session: Session | null;
  onLogout: () => void;
}

export default function UserInfo({ user, session, onLogout }: UserInfoProps) {
  const handleLogout = () => {
    signOut();
    onLogout();
  };

  // 获取用户头像URL，如果没有则使用默认头像
  const getAvatarUrl = () => {
    if (session?.user?.image) {
      return session.user.image;
    }
    // 如果没有头像，返回null使用默认的字母头像
    return null;
  };

  // 获取用户名称的首字母用于默认头像
  const getInitial = () => {
    const name = session?.user?.name || user.user_id;
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          {/* 圆形头像 */}
          <div className="flex-shrink-0">
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl()!}
                alt="用户头像"
                className="w-16 h-16 rounded-full border-2 border-gray-200 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-gray-200">
                {getInitial()}
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">用户信息</h2>
            
            <div className="space-y-2 text-gray-600">
              <div className="flex items-center">
                <span className="font-medium w-24">用户名称:</span>
                <span className="text-purple-600 font-semibold">{session?.user?.name || '未知用户'}</span>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium w-24">用户ID:</span>
                <span className="text-blue-600 font-mono">{user.user_id}</span>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium w-24">积分:</span>
                <span className="text-green-600 font-semibold">{user.points}</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}