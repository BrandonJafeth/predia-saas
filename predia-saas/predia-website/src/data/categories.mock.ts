// Copied verbatim from predia-api/src/scripts/seed-categories.ts — same ids/slugs/
// attribute_schema the real DB seed inserts, so components built against this today
// keep working unchanged once /propiedades reads from the real API.
import type { PropertyCategory } from '../lib/types/property';

export const categories: PropertyCategory[] = [
  {
    id: 'cat_bienes_raices',
    name: 'Bienes Raíces',
    slug: 'bienes-raices',
    description: 'Propiedades residenciales, comerciales y terrenos',
    attribute_schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      required: ['tipo_propiedad', 'area_m2'],
      properties: {
        tipo_propiedad: {
          type: 'string',
          title: 'Tipo de propiedad',
          enum: ['casa', 'apartamento', 'local_comercial', 'oficina', 'bodega', 'lote', 'finca'],
          enumNames: ['Casa', 'Apartamento', 'Local comercial', 'Oficina', 'Bodega', 'Lote / Terreno', 'Finca'],
        },
        area_m2: { type: 'number', title: 'Área total (m²)', minimum: 1 },
        area_construccion_m2: { type: 'number', title: 'Área de construcción (m²)', minimum: 0 },
        habitaciones: { type: 'integer', title: 'Habitaciones', minimum: 0, maximum: 50 },
        banos: { type: 'number', title: 'Baños', minimum: 0, multipleOf: 0.5 },
        parqueos: { type: 'integer', title: 'Parqueos', minimum: 0 },
        niveles: { type: 'integer', title: 'Niveles / Plantas', minimum: 1 },
        ano_construccion: { type: 'integer', title: 'Año de construcción', minimum: 1800, maximum: 2030 },
        amueblado: {
          type: 'string',
          title: 'Amueblado',
          enum: ['sin_amueblar', 'semi_amueblado', 'completamente_amueblado'],
          enumNames: ['Sin amueblar', 'Semi amueblado', 'Completamente amueblado'],
        },
        estado: {
          type: 'string',
          title: 'Estado de la propiedad',
          enum: ['nuevo', 'excelente', 'bueno', 'regular', 'por_remodelar'],
          enumNames: ['Nuevo / Estreno', 'Excelente', 'Bueno', 'Regular', 'Por remodelar'],
        },
        amenidades: {
          type: 'array',
          title: 'Amenidades',
          uniqueItems: true,
          items: {
            type: 'string',
            enum: [
              'piscina', 'gimnasio', 'seguridad_24h', 'portón_eléctrico', 'área_bbq', 'cancha',
              'salón_comunal', 'juegos_infantiles', 'bodega', 'cuarto_servicio', 'terraza', 'balcón',
              'jardín', 'vista_al_mar', 'vista_a_montaña', 'cisterna', 'planta_eléctrica',
              'paneles_solares', 'ascensor', 'pet_friendly',
            ],
            enumNames: [
              'Piscina', 'Gimnasio', 'Seguridad 24h', 'Portón eléctrico', 'Área BBQ', 'Cancha deportiva',
              'Salón comunal', 'Juegos infantiles', 'Bodega', 'Cuarto de servicio', 'Terraza', 'Balcón',
              'Jardín', 'Vista al mar', 'Vista a montaña', 'Cisterna', 'Planta eléctrica',
              'Paneles solares', 'Ascensor', 'Pet friendly',
            ],
          },
        },
      },
    },
  },
  {
    id: 'cat_vehiculos',
    name: 'Vehículos',
    slug: 'vehiculos',
    description: 'Carros, motos, camiones y más',
    attribute_schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      required: ['marca', 'modelo', 'ano', 'tipo_vehiculo'],
      properties: {
        tipo_vehiculo: {
          type: 'string',
          title: 'Tipo de vehículo',
          enum: ['sedan', 'suv', 'pickup', 'hatchback', 'van', 'camion', 'moto', 'cuadriciclo', 'bote', 'otro'],
          enumNames: ['Sedán', 'SUV / Jeep', 'Pickup', 'Hatchback', 'Van / Buseta', 'Camión', 'Moto', 'Cuadriciclo', 'Bote / Lancha', 'Otro'],
        },
        marca: { type: 'string', title: 'Marca', maxLength: 50 },
        modelo: { type: 'string', title: 'Modelo', maxLength: 100 },
        ano: { type: 'integer', title: 'Año', minimum: 1900, maximum: 2026 },
        version: { type: 'string', title: 'Versión / Trim', maxLength: 100 },
        kilometraje: { type: 'integer', title: 'Kilometraje (km)', minimum: 0 },
        transmision: {
          type: 'string',
          title: 'Transmisión',
          enum: ['automatica', 'manual', 'cvt', 'semi_automatica'],
          enumNames: ['Automática', 'Manual', 'CVT', 'Semi-automática'],
        },
        combustible: {
          type: 'string',
          title: 'Combustible',
          enum: ['gasolina', 'diesel', 'hibrido', 'electrico', 'gas'],
          enumNames: ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'Gas'],
        },
        traccion: {
          type: 'string',
          title: 'Tracción',
          enum: ['2wd', '4wd', 'awd'],
          enumNames: ['2WD / Delantera', '4WD / Doble tracción', 'AWD / Full time'],
        },
        color_exterior: { type: 'string', title: 'Color exterior', maxLength: 50 },
        puertas: { type: 'integer', title: 'Puertas', minimum: 1, maximum: 6 },
        cilindros: { type: 'integer', title: 'Cilindros', enum: [3, 4, 5, 6, 8, 10, 12] },
        motor_litros: { type: 'number', title: 'Motor (litros)', minimum: 0.5, maximum: 10 },
        estado: {
          type: 'string',
          title: 'Estado',
          enum: ['nuevo', 'usado', 'reconstruido'],
          enumNames: ['Nuevo (0 km)', 'Usado', 'Reconstruido'],
        },
        extras: {
          type: 'array',
          title: 'Extras',
          uniqueItems: true,
          items: {
            type: 'string',
            enum: [
              'aire_acondicionado', 'sunroof', 'camara_reversa', 'sensores_parking', 'asientos_cuero',
              'asientos_electricos', 'volante_cuero', 'bluetooth', 'apple_carplay', 'android_auto',
              'pantalla_tactil', 'navegacion_gps', 'luces_led', 'llantas_nuevas', 'turbo',
              'control_crucero', 'arranque_remoto', 'vidrios_electricos', 'espejos_electricos', 'techo_panoramico',
            ],
            enumNames: [
              'Aire acondicionado', 'Sunroof', 'Cámara de reversa', 'Sensores de parking', 'Asientos de cuero',
              'Asientos eléctricos', 'Volante de cuero', 'Bluetooth', 'Apple CarPlay', 'Android Auto',
              'Pantalla táctil', 'Navegación GPS', 'Luces LED', 'Llantas nuevas', 'Turbo',
              'Control crucero', 'Arranque remoto', 'Vidrios eléctricos', 'Espejos eléctricos', 'Techo panorámico',
            ],
          },
        },
      },
    },
  },
];

export function getCategoryBySlug(slug: string): PropertyCategory | undefined {
  return categories.find((c) => c.slug === slug);
}
