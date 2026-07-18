import { createFileRoute } from '@tanstack/react-router'
import { Heading, Text } from '@/design-system/typography'
import { PropertyForm } from '@/app/properties/components/PropertyForm'

export const Route = createFileRoute('/properties/new')({
  component: NewPropertyPage,
})

function NewPropertyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Heading as="lg">Nueva propiedad</Heading>
        <Text as="sm" className="text-muted-foreground mt-1">
          Completá los datos básicos para crear la propiedad.
        </Text>
      </div>
      <PropertyForm />
    </div>
  )
}
