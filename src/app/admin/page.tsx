'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import '../../styles/admin.css';

interface User {
  id: string;
  username: string;
  points: number;
  created_at: string;
}

interface UserWithActions extends User {
  isEditing: boolean;
  tempPoints?: number;
}

// 管理员用户ID列表（可以根据需要修改）
const ADMIN_USER_IDS = [
  '393007695958671360', // 替换为实际的管理员Discord用户ID
  // 可以添加更多管理员ID
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserWithActions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 获取所有用户
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }
      const data = await response.json();
      const usersWithActions: UserWithActions[] = (data.users || []).map((user: User) => ({
        ...user,
        isEditing: false,
        tempPoints: undefined
      }));
      setUsers(usersWithActions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 更新用户积分
  const updateUserPoints = async (userId: string, newPoints: number) => {
    try {
      const response = await fetch('/api/admin/update-user-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          points: newPoints,
        }),
      });

      if (!response.ok) {
        throw new Error('更新积分失败');
      }

      // 更新本地状态
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, points: newPoints, isEditing: false, tempPoints: undefined }
          : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    }
  };

  // 开始编辑
  const startEdit = (userId: string, currentPoints: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, isEditing: true, tempPoints: currentPoints }
        : { ...user, isEditing: false, tempPoints: undefined }
    ));
  };

  // 取消编辑
  const cancelEdit = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, isEditing: false, tempPoints: undefined }
        : user
    ));
  };

  // 保存编辑
  const saveEdit = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && user.tempPoints !== undefined) {
      updateUserPoints(userId, user.tempPoints);
    }
  };

  // 快速调整积分
  const adjustPoints = (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const newPoints = Math.max(0, user.points + amount);
      updateUserPoints(userId, newPoints);
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm)
  );

  // 检查用户权限
  useEffect(() => {
    if (status === 'loading') {
      return; // 仍在加载session
    }
    
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      const isAdmin = ADMIN_USER_IDS.includes(session.user.id);
      setIsAuthorized(isAdmin);
      
      if (isAdmin) {
        fetchUsers();
      } else {
        setLoading(false);
      }
    }
  }, [session, status]);

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录用户
  if (status === 'unauthenticated') {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">🔒 管理员登录</h1>
          <p className="admin-subtitle">请先登录以访问管理员面板</p>
        </div>
        <div className="auth-container">
          <button 
            onClick={() => signIn('discord')}
            className="login-button"
          >
            使用 Discord 登录
          </button>
        </div>
      </div>
    );
  }

  // 已登录但无权限的用户
  if (status === 'authenticated' && !isAuthorized) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">⛔ 访问被拒绝</h1>
          <p className="admin-subtitle">您没有访问管理员面板的权限</p>
        </div>
        <div className="auth-container">
          <p className="error-text">当前用户: {session?.user?.name}</p>
          <p className="error-text">用户ID: {session?.user?.id}</p>
          <p className="info-text">如需管理员权限，请联系系统管理员</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">🛠️ 管理员面板</h1>
        <p className="admin-subtitle">用户积分管理系统</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            className="error-close"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="admin-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="搜索用户名或ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        <button 
          onClick={fetchUsers}
          className="refresh-button"
        >
          🔄 刷新
        </button>
      </div>

      <div className="users-grid">
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <p>没有找到用户</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <h3 className="user-name">{user.username}</h3>
                  <p className="user-id">ID: {user.id}</p>
                </div>
              </div>
              
              <div className="points-section">
                <div className="points-display">
                  <span className="points-label">积分:</span>
                  {user.isEditing ? (
                    <input
                      type="number"
                      value={user.tempPoints || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setUsers(prev => prev.map(u => 
                          u.id === user.id 
                            ? { ...u, tempPoints: Math.max(0, value) }
                            : u
                        ));
                      }}
                      className="points-input"
                      min="0"
                    />
                  ) : (
                    <span className="points-value">{user.points}</span>
                  )}
                </div>
                
                <div className="action-buttons">
                  {user.isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(user.id)}
                        className="save-button"
                      >
                        ✅ 保存
                      </button>
                      <button
                        onClick={() => cancelEdit(user.id)}
                        className="cancel-button"
                      >
                        ❌ 取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(user.id, user.points)}
                        className="edit-button"
                      >
                        ✏️ 编辑
                      </button>
                      <div className="quick-actions">
                        <button
                          onClick={() => adjustPoints(user.id, 100)}
                          className="quick-button add"
                        >
                          +100
                        </button>
                        <button
                          onClick={() => adjustPoints(user.id, -100)}
                          className="quick-button subtract"
                        >
                          -100
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}