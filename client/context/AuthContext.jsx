// client/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast'; 

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [tokens, setTokens] = useState({ accessToken: null, refreshToken: null });

  // 1. Duy trì phiên (Chạy khi mount)
  useEffect(() => {
    const storedTokens = localStorage.getItem('authTokens');
    const storedUser = localStorage.getItem('authUser');

    if (storedTokens && storedUser) {
        try {
            const parsedTokens = JSON.parse(storedTokens);
            const parsedUser = JSON.parse(storedUser);
            
            setTokens(parsedTokens);
            setUser(parsedUser);
            setIsAuthenticated(true);
        } catch (e) {
            localStorage.clear();
            console.error("Failed to parse stored tokens or user.", e);
        }
    }
    
    setIsLoading(false);
  }, []);

  // 2. Hàm Đăng nhập 
  const login = useCallback((accessToken, refreshToken, userData) => {
    setTokens({ accessToken, refreshToken });
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('authTokens', JSON.stringify({ accessToken, refreshToken }));
    localStorage.setItem('authUser', JSON.stringify(userData));
    
    // THÔNG BÁO TOAST
    toast.success(`Chào mừng ${userData.name || userData.username}! Đăng nhập thành công.`);
    
  }, []);

  // 3. Hàm Refresh Access Token
  const refreshAccessToken = useCallback(async () => {
    if (!tokens.refreshToken) {
      console.warn('No refresh token available');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken })
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        // Cập nhật access token mới
        const newTokens = { ...tokens, accessToken: data.accessToken };
        setTokens(newTokens);
        localStorage.setItem('authTokens', JSON.stringify(newTokens));
        
        console.log('Access token refreshed successfully');
        return true;
      } else {
        console.error('Failed to refresh token:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }, [tokens, API_URL]);

  // 4. Hàm Đăng xuất 
  const logout = useCallback(() => {
    setTokens({ accessToken: null, refreshToken: null });
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('authUser');
    
    // THÔNG BÁO TOAST
    toast('Bạn đã đăng xuất.', { icon: '👋' });
    
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    user,
    isLoading, 
    tokens,
    login,
    logout,
    refreshAccessToken,
    API_URL 
  }), [isAuthenticated, user, isLoading, tokens, login, logout, refreshAccessToken, API_URL]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;