import { createFileRoute } from '@tanstack/react-router'
import DashboardPage from '@/app/dashboard/components/DashboardPage'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})
