import { createFileRoute } from '@tanstack/react-router'
import RegisterPage from '@/app/auth/components/RegisterPage'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})
