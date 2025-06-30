'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState, LoginRequest, MagicLinkRequest } from '@/types';
import { authService } from '@/services/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  sendMagicLink: (request: MagicLinkRequest) => Promise<{ success: boolean; error?: string }>;
  verifyMagicLink: (token: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if user is already authenticated
      if (authService.isAuthenticated()) {
        const storedUser = authService.getUser();
        if (storedUser) {
          // Verify token is still valid by getting current user
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            setAuthState({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          } else {
            // Token is invalid, clear auth data
            console.log('Token validation failed, clearing auth data');
            authService.clearAuth();
          }
        }
      }

      // Check for magic link token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const magicToken = urlParams.get('token');
      
      if (magicToken) {
        const response = await authService.verifyMagicLink(magicToken);
        if (response.success && response.data) {
          setAuthState({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          // Remove token from URL
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }
      }

      // No valid authentication found
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  };

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 AuthContext: Starting login with credentials:', credentials);
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.login(credentials);
      console.log('🔐 AuthContext: Login response:', response);
      
      if (response.success && response.data) {
        console.log('✅ AuthContext: Login successful, setting user:', response.data.user);
        setAuthState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }

      const error = response.error || 'Login failed';
      console.log('❌ AuthContext: Login failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error,
      }));
      return { success: false, error };
    } catch (error) {
      console.log('💥 AuthContext: Login exception:', error);
      const errorMessage = 'An unexpected error occurred during login';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const sendMagicLink = async (request: MagicLinkRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.sendMagicLink(request);
      
      setAuthState(prev => ({ ...prev, isLoading: false }));

      if (response.success) {
        return { success: true };
      }

      const error = response.error || 'Failed to send magic link';
      setAuthState(prev => ({ ...prev, error }));
      return { success: false, error };
    } catch (error) {
      const errorMessage = 'An unexpected error occurred while sending magic link';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const verifyMagicLink = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.verifyMagicLink(token);
      
      if (response.success && response.data) {
        setAuthState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }

      const error = response.error || 'Invalid or expired magic link';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error,
      }));
      return { success: false, error };
    } catch (error) {
      const errorMessage = 'An unexpected error occurred while verifying magic link';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (!authService.isAuthenticated()) return;

      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setAuthState(prev => ({
          ...prev,
          user: response.data || null,
          error: null,
        }));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    sendMagicLink,
    verifyMagicLink,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 