import { useAuthStore } from '@/stores/auth-store'

/**
 * Custom hook to check authentication status
 * Returns true if user is authenticated (has valid access token), false otherwise
 */
export function useAuth() {
  const { accessToken, user } = useAuthStore((state) => state.auth)
  
  // User is authenticated if they have an access token
  // You can add additional validation here if needed (e.g., token expiration)
  const isAuthenticated = Boolean(accessToken && accessToken.trim() !== '')
  
  return {
    isAuthenticated,
    user,
    accessToken,
  }
}

/**
 * Hook that throws if user is not authenticated
 * Useful for components that require authentication
 */
export function useRequireAuth() {
  const auth = useAuth()
  
  if (!auth.isAuthenticated) {
    throw new Error('Authentication required')
  }
  
  return auth
}