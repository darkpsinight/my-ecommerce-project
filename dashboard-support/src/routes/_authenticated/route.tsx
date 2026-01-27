import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    let { accessToken, user } = useAuthStore.getState().auth

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
      accessToken = useAuthStore.getState().auth.accessToken
      user = useAuthStore.getState().auth.user
    }

    // 3. Strict Role Enforcement (Support Only)
    if (!user?.roles.includes('support')) {
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
