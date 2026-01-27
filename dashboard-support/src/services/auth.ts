import { apiClient } from '@/lib/api-client'
import { AUTH_API } from '@/config/api'
import { useAuthStore } from '@/stores/auth-store'

export interface LoginResponse {
  statusCode: number
  message: string
  success: boolean
  token: string
  emailSuccess: boolean
  emailMessage: string
}

export interface LoginError {
  message: string
  metadata?: {
    hint?: string
    links?: {
      signin?: string
    }
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

class AuthService {
  private static instance: AuthService

  private constructor() { }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post(AUTH_API.SIGNIN, credentials)
      const data = response.data

      if (data.token) {
        useAuthStore.getState().auth.setAccessToken(data.token)
      }
      return data
    } catch (error: any) {
      if (error.response) {
        const loginError = new Error(
          error.response.data?.message || 'Login failed'
        ) as Error & LoginError
        loginError.metadata = error.response.data?.metadata
        throw loginError
      }
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(AUTH_API.LOGOUT)
    } finally {
      useAuthStore.getState().auth.reset()
    }
  }
}

export const authService = AuthService.getInstance()