import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Heading, Text } from '@/design-system/typography'
import { PropertyForm } from '@/app/properties/components/PropertyForm'
import { useProperty } from '@/app/properties/hooks'

export const Route = createFileRoute('/properties/$id/edit')({
  component: EditPropertyPage,
})

function EditPropertyPage() {
  const { id } = Route.useParams()
  const { data: property, isLoading, error } = useProperty(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Heading as="lg">Editar propiedad</Heading>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <Text as="sm" className="text-destructive">
            No se pudo cargar la propiedad. Verificá que exista o intentá de nuevo.
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Heading as="lg">Editar propiedad</Heading>
        <Text as="sm" className="text-muted-foreground mt-1">
          Modificá los datos de la propiedad.
        </Text>
      </div>
      <PropertyForm initialData={property} />
    </div>
  )
}
