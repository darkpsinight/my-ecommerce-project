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
    initAuth: () => Promise<boolean>
    isLoading: boolean
    isInitialized: boolean
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    accessToken: '',
    isLoading: true,
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
