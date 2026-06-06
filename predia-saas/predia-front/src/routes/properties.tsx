import { createFileRoute } from '@tanstack/react-router'
import PropertiesPage from '@/app/properties/components/PropertiesPage'

export const Route = createFileRoute('/properties')({
  component: PropertiesPage,
})
