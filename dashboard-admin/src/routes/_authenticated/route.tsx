import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // 1. Check if we have an access token
    let { accessToken, user } = useAuthStore.getState().auth

    // 2. If no token, try to silent refresh (initAuth)
    if (!accessToken) {
      const success = await useAuthStore.getState().auth.initAuth()
      if (!success) {
        throw redirect({
          to: '/sign-in',
          search: {
            redirect: location.href,
          },
        })
      }
      // Refresh local vars after init
      accessToken = useAuthStore.getState().auth.accessToken
      user = useAuthStore.getState().auth.user
    }

    // 3. Strict Role Enforcement
    if (!user?.roles.includes('admin')) {
      // User has token but wrong role. Force logout.
      useAuthStore.getState().auth.reset()
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
