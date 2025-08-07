'use client';

import { useState } from 'react';
import GachaSystem from '../components/GachaSystem';
import LoginForm from '../components/LoginForm';
import UserInfo from '../components/UserInfo';
import UserInventory from '../components/UserInventory';
import { User } from '../types/user';
import '../styles/gacha.css';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'gacha' | 'inventory'>('gacha');

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('gacha');
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <UserInfo user={user} onLogout={handleLogout} />
        
        {/* 导航标签 */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('gacha')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'gacha'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              抽卡系统
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              我的库存
            </button>
          </div>
        </div>
        
        {/* 内容区域 */}
        {activeTab === 'gacha' ? (
          <GachaSystem user={user} />
        ) : (
          <UserInventory uid={user.user_id} />
        )}
      </div>
    </div>
  );
}
