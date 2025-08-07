'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import GachaSystem from '../components/GachaSystem';
import LoginForm from '../components/LoginForm';
import UserInfo from '../components/UserInfo';
import UserInventory from '../components/UserInventory';
import { AppUser } from '../types/user';
import '../styles/gacha.css';

export default function Home() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState<'gacha' | 'inventory'>('gacha');
  const [loading, setLoading] = useState(true);

  // 处理next-auth session状态
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'loading') {
        return; // 仍在加载session
      }
      
      if (status === 'authenticated' && session?.user?.id) {
        try {
          // 使用session中的用户ID获取用户数据
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid: session.user.id }),
          });

          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            console.log(`用户登录成功: ${session.user.name} (${session.user.id})`);
          } else {
            console.error('获取用户数据失败:', data.message);
          }
        } catch (error) {
          console.error('获取用户数据错误:', error);
        }
      } else if (status === 'unauthenticated') {
        setUser(null);
      }
      
      setLoading(false);
    };

    fetchUserData();
  }, [session, status]);

  const handleLogin = (userData: AppUser) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('gacha');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

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
