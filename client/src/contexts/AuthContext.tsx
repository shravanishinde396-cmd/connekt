import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken, registerLogoutCallback } from '../services/api.js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'placement_officer' | 'recruiter' | 'admin';
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clearAuth = () => {
    setUser(null);
    setAccessToken(null);
  };

  useEffect(() => {
    // Register global logout callback for axios when refresh token fails
    registerLogoutCallback(() => {
      clearAuth();
    });

    const initAuth = async () => {
      try {
        // Try to fetch '/auth/me' on startup.
        // If there's no access token in memory but a refresh cookie is present,
        // the response interceptor will fetch a new access token and retry this request.
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        // Not authenticated on startup, that's fine
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      clearAuth();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
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
