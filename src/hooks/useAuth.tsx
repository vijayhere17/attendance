import { createContext, useContext, useEffect, useState } from 'react';
import * as React from 'react';
import client from '@/api/client';
import { toast } from 'sonner';

interface Profile {
  _id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee' | 'intern';
  batch?: 'batch1' | 'batch2' | null;
  must_change_password?: boolean;
  shift_start?: string;
  shift_end?: string;
  current_streak?: number;
  best_streak?: number;
  total_attendance?: number;
  late_count?: number;
  notification_preferences?;
  avatar_url?: string;
  wfh_enabled?: boolean;
  phone_number?: string;
  monthly_limits?: {
    leave: number;
    late: number;
    wfh: number;
  };
  month_stats?: {
    leave: number;
    late: number;
    wfh: number;
  };
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signIn: async () => { },
  signOut: () => { },
  signUp: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await client.get('/auth/profile');
      setUser(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await client.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data);
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error('Login error:', error);
      if (!error.response) {
        toast.error('Network Error: Cannot reach the server. Please check VITE_API_URL configuration.');
      } else {
        toast.error(error.response?.data?.message || 'Login failed');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data } = await client.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });
      localStorage.setItem('token', data.token);
      setUser(data);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Signed out successfully');
  };

  const value = {
    user,
    profile: user,
    loading,
    isAdmin: user?.role === 'admin',
    signIn,
    signOut,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
