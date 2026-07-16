// One icon per attribute_schema field key (not per value — see amenity-icons.ts
// for that). Same 24x24/1.4-stroke language so "Detalles" reads as a scannable
// icon grid instead of a spec-sheet dt/dl list.
export const attributeIcons: Record<string, string> = {
  tipo_propiedad: 'M4 11 12 4l8 7M6 10v10h12V10M10 20v-6h4v6',
  area_m2: 'M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5',
  area_construccion_m2: 'M3 8h18v8H3V8Zm4 0v3m4-3v5m4-5v3m4-3v5',
  habitaciones: 'M3 18v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1h2v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6M3 18h18M3 18v2M21 18v2M5 12V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1',
  banos: 'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Zm2 0V6a2 2 0 0 1 3.5-1.3M4 19v2M18 19v2',
  parqueos: 'M4 16V9l2-4h12l2 4v7M4 16h16M4 16v3M20 16v3M7 12h.01M17 12h.01',
  niveles: 'M12 4 3 8l9 4 9-4-9-4Zm-9 8 9 4 9-4M3 16l9 4 9-4',
  ano_construccion: 'M4 5h16v16H4V5Zm0 5h16M8 3v4M16 3v4',
  amueblado: 'M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M3 12h18v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Zm2 6v2m14-2v2',
  estado: 'M12 3.5 5 6v5.2c0 4.4 2.9 7.7 7 8.8 4.1-1.1 7-4.4 7-8.8V6l-7-2.5Zm-2.2 8.2 1.7 1.7 3.2-3.6',
  tipo_vehiculo: 'M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13M3 13v5h2m14 0h2v-5M3 13h18M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  marca: 'M4 4h7l9 9-7 7-9-9V4Zm4 4h.01',
  modelo: 'M4 7h16v13H4V7Zm4-4h8v4H8V3Z',
  ano: 'M4 5h16v16H4V5Zm0 5h16M8 3v4M16 3v4',
  version: 'M6 3h12v18l-6-4-6 4V3Z',
  kilometraje: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-9 4-4M12 3v2M12 19v2M3 12h2M19 12h2',
  transmision: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3h2M3 12h2m12.7-6.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 3v2m0 14v2',
  combustible: 'M5 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M4 21h12M15 9h2l3 3v6a1.5 1.5 0 0 1-3 0v-3h-2M8 6h3',
  traccion: 'M12 3v18M3 12h18M12 3l-2 4h4l-2-4Zm0 18 2-4h-4l2 4ZM3 12l4-2v4l-4-2Zm18 0-4-2v4l4-2Z',
  color_exterior:
    'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 9 9c0 1.5-1 2.5-2.5 2.5H16a2 2 0 0 0-2 2c0 1 .5 1.5.5 2.5 0 1-1 2-2.5 2Zm-4.5-9a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm2-3.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm4 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm2 3.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z',
  puertas: 'M6 3h9v18H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm9 0 3 1v16l-3 1M9 12h.01',
  cilindros: 'M4 10h3v8H4v-8Zm4-3h3v11H8V7Zm4-3h3v14h-3V4Zm4 5h3v9h-3V9Z',
  motor_litros:
    'M12 3c1.8 2 2.6 3.6 1.8 5.2C13 9.6 11.4 9 12 7c-2 1.6-2.6 4-1.2 5.8A3.2 3.2 0 0 1 8 11c-1 2.6.4 5 4 5s5-2.4 4-5a3.2 3.2 0 0 1-2.8 1.8c1-2 .6-3.8-1-5.4Z',
};

export const DEFAULT_ATTRIBUTE_ICON = 'M12 8v4l3 3M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z';
