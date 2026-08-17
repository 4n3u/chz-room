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

  const refreshUser = async () => {
    try {
      const res = await axios.get('/api/auth/me', { withCredentials: true });
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
    window.location.href = '/api/auth/chzzk/login';
  };

  const mockLogin = async (profile: { channelName: string; channelId?: string; channelImageUrl?: string }) => {
    const res = await axios.post('/api/auth/mock-login', profile, { withCredentials: true });
    if (res.data?.success && res.data?.user) {
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    try {
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
