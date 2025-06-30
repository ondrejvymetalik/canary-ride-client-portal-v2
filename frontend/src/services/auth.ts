import { apiService } from './api';
import { AuthResponse, LoginRequest, MagicLinkRequest, User, ApiResponse } from '@/types';

class AuthService {
  // Login with booking number and email
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    console.log('🌐 AuthService: Making login request to /auth/login with:', credentials);
    
    const response = await apiService.post('/auth/login', credentials);
    console.log('🌐 AuthService: API response:', response);
    console.log('🌐 AuthService: response.data structure:', JSON.stringify(response.data, null, 2));
    
    // Handle the response from API service (already extracted from backend)
    if (response.success && response.data) {
      const authData = response.data;
      console.log('✅ AuthService: Setting auth data:', authData);
      apiService.setAuthData(authData);
      
      return {
        success: true,
        data: authData
      };
    } else {
      console.log('❌ AuthService: Login failed, response:', response);
      return {
        success: false,
        error: response.error || 'Login failed'
      };
    }
  }

  // Send magic link to email
  async sendMagicLink(request: MagicLinkRequest): Promise<ApiResponse> {
    return await apiService.post('/auth/magic-link', request);
  }

  // Verify magic link token
  async verifyMagicLink(token: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.get<AuthResponse>(`/auth/magic-link/verify?token=${token}`);
    
    if (response.success && response.data) {
      apiService.setAuthData(response.data);
    }
    
    return response;
  }

  // Refresh access token
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return await apiService.post('/auth/refresh');
  }

  // Logout
  async logout(): Promise<ApiResponse> {
    const response = await apiService.post('/auth/logout');
    apiService.logout();
    return response;
  }

  // Get current user info
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return await apiService.get('/auth/me');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const user = apiService.getStoredUser();
      return !!(token && user);
    } catch (error) {
      console.warn('Error checking authentication status:', error);
      // Clear potentially corrupted auth data
      this.clearAuth();
      return false;
    }
  }

  // Get stored user data
  getUser(): User | null {
    return apiService.getStoredUser();
  }

  // Clear auth data
  clearAuth(): void {
    apiService.logout();
  }
}

export const authService = new AuthService();
export default authService; 