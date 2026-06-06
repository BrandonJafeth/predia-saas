import { Display, Heading, Text } from '@/design-system/typography'
import { Card, CardContent } from '@/design-system/ui/card'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Building2, Users, TrendingUp, DollarSign } from 'lucide-react'

const stats = [
  { label: 'Propiedades', value: '24', icon: Building2 },
  { label: 'Leads Activos', value: '143', icon: Users },
  { label: 'Tasa Conversión', value: '12.5%', icon: TrendingUp },
  { label: 'Ingresos', value: '$89,450', icon: DollarSign },
]

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Display as="sm">Dashboard</Display>
          <Text as="sm" className="text-muted-foreground mt-1">
            Resumen general de tu negocio
          </Text>
        </div>
        <Button>Descargar reporte</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-card">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Text as="caption" className="text-muted-foreground">
                  {stat.label}
                </Text>
                <Heading as="md">{stat.value}</Heading>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Heading as="sm">Propiedades recientes</Heading>
            <div className="mt-4 space-y-3">
              {[
                { name: 'Av. Corrientes 1234', status: 'Activa' },
                { name: 'Cabrera 567', status: 'Pendiente' },
                { name: 'Palermo Soho Loft', status: 'Activa' },
              ].map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between rounded-lg bg-surface-soft px-4 py-3"
                >
                  <Text as="sm">{p.name}</Text>
                  <Badge
                    variant={p.status === 'Activa' ? 'emerald' : 'orange'}
                  >
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Heading as="sm">Leads recientes</Heading>
            <div className="mt-4 space-y-3">
              {[
                { name: 'Juan Pérez', email: 'juan@email.com' },
                { name: 'María García', email: 'maria@email.com' },
                { name: 'Carlos López', email: 'carlos@email.com' },
              ].map((l) => (
                <div
                  key={l.email}
                  className="flex items-center justify-between rounded-lg bg-surface-soft px-4 py-3"
                >
                  <div>
                    <Text as="sm" className="font-medium">{l.name}</Text>
                    <Text as="caption" className="text-muted-foreground">{l.email}</Text>
                  </div>
                  <Badge variant="default">
                    Nuevo
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
