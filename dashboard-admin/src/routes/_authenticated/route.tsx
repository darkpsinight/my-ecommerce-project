import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // Get the current auth state
    const { accessToken } = useAuthStore.getState().auth
    
    // Check if user is authenticated
    const isAuthenticated = Boolean(accessToken && accessToken.trim() !== '')
    
    // If not authenticated, redirect to sign-in with the current path as redirect parameter
    if (!isAuthenticated) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
