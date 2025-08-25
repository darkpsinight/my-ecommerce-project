import axios from 'axios'
import { AUTH_API } from '@/config/api'
import { getCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'support_auth_token'

// Function to get token from cookie directly
const getAuthToken = (): string | null => {
  try {
    const cookieValue = getCookie(ACCESS_TOKEN)
    
    if (!cookieValue) {
      return null
    }
    // The token is stored as JSON string in cookie
    const token = JSON.parse(cookieValue)
    const result = token && token.trim() !== '' ? token : null
    return result
  } catch (_error) {
    return null
  }
}

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

  // Private constructor for singleton pattern
  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axios.post(
        AUTH_API.SIGNIN,
        credentials,
        {
          withCredentials: true // Enable sending/receiving cookies
        }
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const loginError = new Error(
          error.response?.data?.message || 'Login failed, try again later'
        ) as Error & LoginError
        loginError.metadata = error.response?.data?.metadata
        throw loginError
      }
      throw error
    }
  }

  async logout(): Promise<void> {
    // Get token using the helper function to avoid circular dependency
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }
    
    // Send request to backend to clear the HTTP-only cookie and blacklist token
    await axios.post(
      AUTH_API.LOGOUT,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    )
  }
}

export const authService = AuthService.getInstance()