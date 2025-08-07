'use client';

import { signOut } from 'next-auth/react';
import { User } from '@/types/user';

interface UserInfoProps {
  user: User;
  onLogout: () => void;
}

export default function UserInfo({ user, onLogout }: UserInfoProps) {
  const handleLogout = () => {
    signOut();
    onLogout();
  };
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">用户信息</h2>
          
          <div className="space-y-2 text-gray-600">
            <div className="flex items-center">
              <span className="font-medium w-24">用户ID:</span>
              <span className="text-blue-600 font-mono">{user.user_id}</span>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium w-24">积分:</span>
              <span className="text-green-600 font-semibold">{user.points}</span>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium w-24">今日付费抽卡:</span>
              <span className="text-orange-600">{user.paid_draws_today} 次</span>
            </div>
            
            {user.last_draw && (
              <div className="flex items-center">
                <span className="font-medium w-24">上次抽卡:</span>
                <span>{new Date(user.last_draw).toLocaleDateString('zh-CN')}</span>
              </div>
            )}
            
            {user.last_wheel && (
              <div className="flex items-center">
                <span className="font-medium w-24">上次转盘:</span>
                <span>{new Date(user.last_wheel).toLocaleDateString('zh-CN')}</span>
              </div>
            )}
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