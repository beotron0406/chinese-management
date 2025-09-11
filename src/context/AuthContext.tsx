"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define your User type if not already defined in types/index.ts
interface User {
  id: number;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

// Create the context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL from your environment variables or hardcoded for now
const API_BASE_URL = 'http://26.112.47.221:3000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const { access_token } = await response.json();
      localStorage.setItem('auth_token', access_token);
      
      await checkAuthStatus(); // Verify and get user profile
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
      });

      if (!response.ok) {
        throw new Error('Token invalid');
      }

      // Get user profile after confirming token is valid
      const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
      });
      
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await profileResponse.json();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated, 
      login, 
      logout, 
      checkAuthStatus 
    }}>
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