// Minimal line-icon set for the enum values in seed-categories.ts (amenidades +
// extras). One shared visual language (24x24, 1.4 stroke, rounded caps) so a grid
// of these reads as one system, Airbnb-style, instead of a bullet list of text.
// Unmapped values (schema grows over time) fall back to a plain check mark.
export const amenityIcons: Record<string, string> = {
  // --- bienes-raices: amenidades ---
  piscina: 'M3 16c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0M6 8l3-4 3 4 3-4',
  gimnasio: 'M4 12h2M18 12h2M6 8v8M18 8v8M8.5 12h7',
  seguridad_24h: 'M12 3.5 5 6v5.2c0 4.4 2.9 7.7 7 8.8 4.1-1.1 7-4.4 7-8.8V6l-7-2.5Zm-2.2 8.2 1.7 1.7 3.2-3.6',
  'portón_eléctrico': 'M4 20V7l8-3 8 3v13M4 20h16M8 20v-6h8v6M13 4.5V9',
  'área_bbq': 'M9 21h6M12 3c1.8 2 2.6 3.6 1.8 5.2C13 9.6 11.4 9 12 7c-2 1.6-2.6 4-1.2 5.8A3.2 3.2 0 0 1 8 11c-1 2.6.4 5 4 5s5-2.4 4-5a3.2 3.2 0 0 1-2.8 1.8c1-2 .6-3.8-1-5.4Z',
  cancha: 'M4 5h16v14H4V5Zm0 7h16M12 5v14M8 8.5v3M16 12.5v3',
  'salón_comunal': 'M4 21V10l8-6 8 6v11M4 21h16M9 21v-6h6v6',
  juegos_infantiles: 'M6 21V8m12 13V13M6 8a3 3 0 1 1 0-6M18 13a2.5 2.5 0 1 0 0-5M6 14h5l1 3H7Z',
  bodega: 'M4 8.5 12 4l8 4.5V19H4V8.5Zm0 0L12 13l8-4.5M12 13v6',
  cuarto_servicio: 'M6 3v18M6 8h5a3 3 0 0 1 0 6H6M15 3v18',
  terraza: 'M3 9h18M5 9v11h14V9M9 20v-6h6v6',
  'balcón': 'M4 11h16v9H4v-9Zm0 0V5h16v6M8 20v-6M12 20v-6M16 20v-6',
  'jardín': 'M12 21c0-6 0-9-3-12M12 21c0-4 0-7 3-10M6 9c2 0 3.5 1.5 3.5 3.5M18 6.5C16 6.5 14.5 8 14.5 10',
  vista_al_mar: 'M3 15c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0M3 19c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0M17 4a3 3 0 1 1-6 0',
  'vista_a_montaña': 'm3 18 6-10 4 6 2-3 6 7H3Z',
  cisterna: 'M12 3c3 3.6 5 6.4 5 9.2a5 5 0 0 1-10 0C7 9.4 9 6.6 12 3Z',
  'planta_eléctrica': 'M11 3 4 14h6l-1 7 7-11h-6l1-7Z',
  paneles_solares: 'M4 8h8l-2 12H2Zm8 0h8l-2 12h-8M6 11h4M15 11h4',
  ascensor: 'M6 20V4h12v16H6Zm3-11 3-3 3 3m-6 6 3 3 3-3',
  pet_friendly: 'M12 15c-3 0-5.5 1.8-5.5 4.2 0 1.5 1.2 1.8 2.3 1.1 1-.6 2-1 3.2-1s2.2.4 3.2 1c1.1.7 2.3.4 2.3-1.1C17.5 16.8 15 15 12 15Zm-5-3.2a1.8 2 0 1 0 0-4 1.8 2 0 0 0 0 4Zm10 0a1.8 2 0 1 0 0-4 1.8 2 0 0 0 0 4ZM9 8.5a1.6 2 0 1 0 0-4 1.6 2 0 0 0 0 4Zm6 0a1.6 2 0 1 0 0-4 1.6 2 0 0 0 0 4Z',

  // --- vehiculos: extras ---
  aire_acondicionado: 'M12 3v18M4.5 6.5l15 11M19.5 6.5l-15 11M4 12h16',
  sunroof: 'M4 11 12 5l8 6M6 11v8h12v-8',
  camara_reversa: 'M4 8h11l3 3v5H4V8Zm11 0V6a2 2 0 0 0-2-2H9v4M8.5 13.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z',
  sensores_parking: 'M12 3a9 9 0 0 1 8 13M12 3a9 9 0 0 0-8 13M12 7a5 5 0 0 1 4.4 7.4M12 7a5 5 0 0 0-4.4 7.4M12 21v-3',
  asientos_cuero: 'M7 21v-7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v7M7 21h10M9 11V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5',
  asientos_electricos: 'M7 21v-7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v7M7 21h10M13.5 3l-2 4h2.5l-2 4',
  volante_cuero: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-8V4m0 8-5 6m5-6 5 6',
  bluetooth: 'M8 8.5 16 15l-4 3.5v-13L16 9l-8 6.5',
  apple_carplay: 'M5 5h14v14H5V5Zm4 10V9l6 3-6 3Z',
  android_auto: 'M4 10h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Zm2-3 1.5-3M18 7l-1.5-3M8 14h.01M16 14h.01',
  pantalla_tactil: 'M5 4h14v13H5V4Zm4 16h6M8.5 8.5h7v6h-7z',
  navegacion_gps: 'M12 21s7-6.8 7-12a7 7 0 1 0-14 0c0 5.2 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  luces_led: 'M9 18h6M10 21h4M8.5 14a3.5 3.5 0 1 1 7 0c0 1.6-1 2.2-1.7 3H10.2c-.7-.8-1.7-1.4-1.7-3ZM12 3v2M5 6l1.5 1.5M19 6l-1.5 1.5',
  llantas_nuevas: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-4.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM12 4v2m0 12v2m8-8h-2M6 12H4m11.7-5.7-1.4 1.4m-8.6 8.6-1.4 1.4m0-11.4 1.4 1.4m8.6 8.6 1.4 1.4',
  turbo: 'M12 3a9 9 0 1 0 9 9M12 3v4m0 10v4M3 12h4m10 0h4',
  control_crucero: 'M4 15a8 8 0 0 1 16 0M4 15h16M12 15V9m0 0-2.5 2.5M12 9l2.5 2.5',
  arranque_remoto: 'M13 2 4 14h6l-1 8 9-12h-6l1-8ZM4 20l3-3',
  vidrios_electricos: 'M5 4h14v13H5V4Zm4 16 1.5-3M15 20l-1.5-3',
  espejos_electricos: 'M12 3v18M6 8h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H6V8Zm10 0h-2a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h2V8Z',
  techo_panoramico: 'M3 11 12 4l9 7M5 11v9h14v-9M9 20v-5M15 20v-5M6 4l1.5 3M18 4l-1.5 3',
};

export const DEFAULT_AMENITY_ICON = 'm5 13 4 4L19 7';
