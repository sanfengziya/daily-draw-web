'use client';

import { useState, useEffect } from 'react';
import GachaSystem from '../components/GachaSystem';
import LoginForm from '../components/LoginForm';
import UserInfo from '../components/UserInfo';
import UserInventory from '../components/UserInventory';
import { User } from '../types/user';
import '../styles/gacha.css';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'gacha' | 'inventory'>('gacha');
  const [loading, setLoading] = useState(true);

  // 检查Discord登录回调
  useEffect(() => {
    const checkDiscordLogin = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const discordLogin = urlParams.get('discord_login');
      const uid = urlParams.get('uid');
      const username = urlParams.get('username');
      const error = urlParams.get('error');

      if (error) {
        console.error('Discord登录错误:', error);
        alert('Discord登录失败，请重试');
        // 清理URL参数
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoading(false);
        return;
      }

      if (discordLogin === 'success' && uid) {
        try {
          // 使用Discord UID登录
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid }),
          });

          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            console.log(`Discord用户登录成功: ${username} (${uid})`);
          } else {
            console.error('登录失败:', data.message);
            alert('登录失败，请重试');
          }
        } catch (error) {
          console.error('登录请求错误:', error);
          alert('登录失败，请重试');
        }
        
        // 清理URL参数
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      setLoading(false);
    };

    checkDiscordLogin();
  }, []);

  const handleLogin = (userData: User) => {
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
