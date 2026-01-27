import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { SignIn } from '@/features/auth/sign-in'
import { useAuthStore } from '@/stores/auth-store'

// Define search parameters schema
const signInSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  validateSearch: signInSearchSchema,
  beforeLoad: async () => {
    const { isInitialized, initAuth } = useAuthStore.getState().auth

    if (!isInitialized) {
      await initAuth()
    }

    const { accessToken } = useAuthStore.getState().auth
    if (accessToken) {
      throw redirect({
        to: '/',
        replace: true,
      })
    }
  },
  component: SignIn,
})
