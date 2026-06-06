import { Display, Heading, Text } from '@/design-system/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/ui/card'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Plus, MapPin, Bed, Bath, Square } from 'lucide-react'

const properties = [
  {
    id: 1,
    name: 'Av. Corrientes 1234',
    type: 'Departamento',
    status: 'Activa',
    price: '$250,000',
    beds: 3,
    baths: 2,
    area: '85m²',
    location: 'Recoleta, CABA',
  },
  {
    id: 2,
    name: 'Cabrera 567',
    type: 'Casa',
    status: 'Pendiente',
    price: '$180,000',
    beds: 2,
    baths: 1,
    area: '65m²',
    location: 'Villa Crespo, CABA',
  },
  {
    id: 3,
    name: 'Palermo Soho Loft',
    type: 'PH',
    status: 'Activa',
    price: '$320,000',
    beds: 2,
    baths: 2,
    area: '90m²',
    location: 'Palermo, CABA',
  },
]

function PropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Display as="sm">Propiedades</Display>
          <Text as="sm" className="text-muted-foreground mt-1">
            Gestiona tu cartera de propiedades
          </Text>
        </div>
        <Button className="self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Nueva propiedad
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <div className="aspect-video w-full bg-surface-card" />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <Text as="caption">{p.location}</Text>
                  </div>
                </div>
                <Badge variant={p.status === 'Activa' ? 'default' : 'orange'}>
                  {p.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5" />
                  {p.beds}
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5" />
                  {p.baths}
                </span>
                <span className="flex items-center gap-1">
                  <Square className="h-3.5 w-3.5" />
                  {p.area}
                </span>
              </div>
              <div className="mt-4">
                <Heading as="sm">{p.price}</Heading>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PropertiesPage
