import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { authAPI } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'admin' | 'member') => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, avatar: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Attempt to recover session from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    authAPI.getProfile()
      .then((profile) => {
        setUser(profile);
      })
      .catch((err) => {
        console.error('Session restoration failed', err);
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { token, user: loggedUser } = await authAPI.login({ email, password });
      localStorage.setItem('token', token);
      setUser(loggedUser);
    } catch (err: any) {
      localStorage.removeItem('token');
      setUser(null);
      throw err.response?.data?.message || 'Login failed. Please verify your credentials.';
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: 'admin' | 'member') => {
    setLoading(true);
    try {
      const { token, user: newUser } = await authAPI.register({ name, email, password, role });
      localStorage.setItem('token', token);
      setUser(newUser);
    } catch (err: any) {
      localStorage.removeItem('token');
      setUser(null);
      throw err.response?.data?.message || 'Registration failed. Please try again.';
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (name: string, avatar: string) => {
    try {
      const updatedUser = await authAPI.updateProfile({ name, avatar });
      setUser(updatedUser);
    } catch (err: any) {
      throw err.response?.data?.message || 'Failed to update profile info.';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
