import { createFileRoute } from '@tanstack/react-router'
import LoginPage from '@/app/login/components/LoginPage'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
