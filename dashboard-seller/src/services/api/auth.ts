import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

export interface LoginResponse {
  statusCode: number;
  message: string;
  success: boolean;
  token: string;
  verifyToken: string;
  emailSuccess: boolean;
  emailMessage: string;
}

export interface LoginError {
  message: string;
  metadata?: {
    hint?: string;
    links?: {
      signin?: string;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class AuthService {
  private static instance: AuthService;

  // Empty constructor is required for the Singleton pattern
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/seller-signin`, credentials);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const loginError = new Error(error.response?.data?.message || 'Login failed') as Error & LoginError;
        loginError.metadata = error.response?.data?.metadata;
        throw loginError;
      }
      throw error;
    }
  }

  async googleLogin(): Promise<LoginResponse> {
    // Implement Google login when ready
    throw new Error('Google login is not implemented yet');
  }

  setAuthTokens(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }
}

export const authService = AuthService.getInstance(); 