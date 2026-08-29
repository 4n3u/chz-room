import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { ChzzkUser } from '../types';

interface AuthContextType {
  user: ChzzkUser | null;
  loading: boolean;
  loginWithChzzk: () => void;
  mockLogin: (profile: { channelName: string; channelId?: string; channelImageUrl?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ChzzkUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Setup Axios request interceptor to always attach Bearer token if stored in localStorage
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('chzzk_token');
      if (storedToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  const refreshUser = async () => {
    try {
      // 1. Check if token is passed in query parameter (e.g. from OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      const errorFromUrl = urlParams.get('error');

      if (errorFromUrl) {
        console.error('[Chzzk Login Error]:', decodeURIComponent(errorFromUrl));
        alert(`치지직 로그인 오류: ${decodeURIComponent(errorFromUrl)}`);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (tokenFromUrl) {
        localStorage.setItem('chzzk_token', tokenFromUrl);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }

      const storedToken = localStorage.getItem('chzzk_token');
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await axios.get('/api/auth/me', {
        withCredentials: true,
        headers,
      });

      setUser(res.data?.user || null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithChzzk = () => {
    const origin = window.location.origin;
    window.location.href = `/api/auth/chzzk/login?returnTo=${encodeURIComponent(origin)}`;
  };

  const mockLogin = async (profile: { channelName: string; channelId?: string; channelImageUrl?: string }) => {
    const res = await axios.post('/api/auth/mock-login', profile, { withCredentials: true });
    if (res.data?.success && res.data?.user) {
      if (res.data.token) {
        localStorage.setItem('chzzk_token', res.data.token);
      }
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('chzzk_token');
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithChzzk, mockLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
