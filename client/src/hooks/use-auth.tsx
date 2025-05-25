import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "./use-toast";

// User type
interface User {
  id: number;
  username: string;
  role: string;
  createdAt?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  checkAuth: async () => {},
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth-token');
      
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('auth-token');
        setUser(null);
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      localStorage.removeItem('auth-token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });
      
      const data = await response.json();
      
      // Store JWT token in localStorage
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      
      setUser(data.user);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/auth/logout");
      
      // Clear JWT token from localStorage
      localStorage.removeItem('auth-token');
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, clear local storage and user state
      localStorage.removeItem('auth-token');
      setUser(null);
      
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Auth context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Auth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};