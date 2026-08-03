import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Catálogo compartido de amenidades (sin tenant_id, sin RLS) — mismas claves
// que predia-website/src/lib/amenity-icons.ts para que el icono mapee directo.
// El slug es el identificador estable entre entornos.
const AMENITIES = [
  { slug: 'piscina', name: 'Piscina' },
  { slug: 'gimnasio', name: 'Gimnasio' },
  { slug: 'seguridad_24h', name: 'Seguridad 24h' },
  { slug: 'portón_eléctrico', name: 'Portón eléctrico' },
  { slug: 'área_bbq', name: 'Área BBQ' },
  { slug: 'cancha', name: 'Cancha deportiva' },
  { slug: 'salón_comunal', name: 'Salón comunal' },
  { slug: 'juegos_infantiles', name: 'Juegos infantiles' },
  { slug: 'bodega', name: 'Bodega' },
  { slug: 'cuarto_servicio', name: 'Cuarto de servicio' },
  { slug: 'terraza', name: 'Terraza' },
  { slug: 'balcón', name: 'Balcón' },
  { slug: 'jardín', name: 'Jardín' },
  { slug: 'vista_al_mar', name: 'Vista al mar' },
  { slug: 'vista_a_montaña', name: 'Vista a montaña' },
  { slug: 'cisterna', name: 'Cisterna' },
  { slug: 'planta_eléctrica', name: 'Planta eléctrica' },
  { slug: 'paneles_solares', name: 'Paneles solares' },
  { slug: 'ascensor', name: 'Ascensor' },
  { slug: 'pet_friendly', name: 'Pet friendly' },
  // --- vehiculos: extras convertidos a amenidades ---
  { slug: 'aire_acondicionado', name: 'Aire acondicionado' },
  { slug: 'sunroof', name: 'Sunroof' },
  { slug: 'camara_reversa', name: 'Cámara de reversa' },
  { slug: 'sensores_parking', name: 'Sensores de parking' },
  { slug: 'asientos_cuero', name: 'Asientos de cuero' },
  { slug: 'asientos_electricos', name: 'Asientos eléctricos' },
  { slug: 'volante_cuero', name: 'Volante de cuero' },
  { slug: 'bluetooth', name: 'Bluetooth' },
  { slug: 'apple_carplay', name: 'Apple CarPlay' },
  { slug: 'android_auto', name: 'Android Auto' },
  { slug: 'pantalla_tactil', name: 'Pantalla táctil' },
  { slug: 'navegacion_gps', name: 'Navegación GPS' },
  { slug: 'luces_led', name: 'Luces LED' },
  { slug: 'llantas_nuevas', name: 'Llantas nuevas' },
  { slug: 'turbo', name: 'Turbo' },
  { slug: 'control_crucero', name: 'Control crucero' },
  { slug: 'arranque_remoto', name: 'Arranque remoto' },
  { slug: 'vidrios_electricos', name: 'Vidrios eléctricos' },
  { slug: 'espejos_electricos', name: 'Espejos eléctricos' },
  { slug: 'techo_panoramico', name: 'Techo panorámico' },
];

async function main() {
  const databaseUrl = process.env.SYSTEM_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('SYSTEM_DATABASE_URL (or DATABASE_URL) not set.');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const amenity of AMENITIES) {
      await prisma.amenity.upsert({
        where: { slug: amenity.slug },
        create: { ...amenity, icon: amenity.slug },
        update: { name: amenity.name, icon: amenity.slug },
      });
      console.log(`✓ ${amenity.name} (${amenity.slug})`);
    }

    console.log(`\n✓ Seed completo — ${AMENITIES.length} amenidades`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
