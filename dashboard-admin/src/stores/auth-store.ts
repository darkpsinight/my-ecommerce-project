import { create } from 'zustand'
import { AUTH_API } from '@/config/api'
import axios from 'axios'
import { decodeJWT, JWTPayload } from '@/utils/jwt'

interface AuthState {
  auth: {
    user: JWTPayload | null
    accessToken: string
    setAccessToken: (token: string) => void
    reset: () => void
    initAuth: () => Promise<boolean> // Returns true if authenticated
    isLoading: boolean
    isInitialized: boolean
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    accessToken: '',
    isLoading: true, // Start in loading state
    isInitialized: false,

    setAccessToken: (token: string) => {
      const user = decodeJWT(token)
      set((state) => ({
        auth: {
          ...state.auth,
          accessToken: token,
          user,
          isLoading: false,
        },
      }))
    },

    reset: () =>
      set((state) => ({
        auth: {
          ...state.auth,
          user: null,
          accessToken: '',
          isLoading: false,
        },
      })),

    initAuth: async () => {
      try {
        // Attempt to refresh immediately
        const response = await axios.post(
          AUTH_API.REFRESH_TOKEN,
          {},
          { withCredentials: true }
        )

        const { token } = response.data
        if (token) {
          const user = decodeJWT(token)
          set((state) => ({
            auth: {
              ...state.auth,
              accessToken: token,
              user,
              isLoading: false,
              isInitialized: true,
            },
          }))
          return true
        }
      } catch (error) {
        // Determine if it was network error or auth error?
        // If 401/403, we are definitely logged out.
        // If network error, we might be offline, but without token we are Guest.
        // So just reset.
        set((state) => ({
          auth: {
            ...state.auth,
            user: null,
            accessToken: '',
            isLoading: false,
            isInitialized: true,
          },
        }))
      }
      return false
    },
  },
}))
