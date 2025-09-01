import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, password: string) => Promise<{ error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        const savedUser = localStorage.getItem('adobe_user');
        const loginTime = localStorage.getItem('adobe_login_time');
        
        if (savedUser && loginTime) {
          const timeDiff = Date.now() - parseInt(loginTime);
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          
          // Check if login is still valid (30 days)
          if (daysDiff < 30) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setLoading(false);
            return;
          } else {
            // Session expired, clear storage
            localStorage.removeItem('adobe_user');
            localStorage.removeItem('adobe_login_time');
          }
        }
      } catch (error) {
        // If there's any error parsing stored data, clear it
        localStorage.removeItem('adobe_user');
        localStorage.removeItem('adobe_login_time');
      }
      
      setLoading(false);
    };

    checkExistingAuth();

    // Also listen for storage changes across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adobe_user' || e.key === 'adobe_login_time') {
        checkExistingAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { data: authData, error } = await supabase.functions.invoke('auth-login', {
        body: { username, password }
      });

      if (error) {
        return { error: 'Login failed' };
      }

      if (authData?.valid && authData?.userId) {
        const userData = { id: authData.userId, username };
        setUser(userData);
        localStorage.setItem('adobe_user', JSON.stringify(userData));
        localStorage.setItem('adobe_login_time', Date.now().toString());
        return {};
      } else {
        return { error: authData?.error || 'Invalid username or password' };
      }
    } catch (error) {
      return { error: 'Login failed' };
    }
  };

  const register = async (username: string, password: string) => {
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { error: 'Username already exists' };
      }

      // Hash password and create user
      const { data: authData } = await supabase.functions.invoke('auth-register', {
        body: { username, password }
      });

      if (authData?.userId) {
        const userData = { id: authData.userId, username };
        setUser(userData);
        localStorage.setItem('adobe_user', JSON.stringify(userData));
        localStorage.setItem('adobe_login_time', Date.now().toString());
        return {};
      } else {
        return { error: 'Registration failed' };
      }
    } catch (error) {
      return { error: 'Registration failed' };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) {
      return { error: 'Not authenticated' };
    }

    try {
      // Verify old password
      const { data: authData } = await supabase.functions.invoke('auth-login', {
        body: { username: user.username, password: oldPassword }
      });

      if (!authData?.valid) {
        return { error: 'Current password is incorrect' };
      }

      // Update password
      const { data: updateData } = await supabase.functions.invoke('auth-register', {
        body: { username: user.username, password: newPassword, isUpdate: true, userId: user.id }
      });

      if (updateData?.success) {
        return {};
      } else {
        return { error: 'Failed to update password' };
      }
    } catch (error) {
      return { error: 'Password change failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('adobe_user');
    localStorage.removeItem('adobe_login_time');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}