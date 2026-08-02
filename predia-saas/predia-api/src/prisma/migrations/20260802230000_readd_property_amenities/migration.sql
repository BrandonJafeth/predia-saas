-- Reintroduce la tabla pivote property_amenities para almacenar la selección
-- de amenidades por propiedad (pre-marcadas desde el catálogo de la categoría).
-- RLS directo (defensivo) + seed de filas desde category_amenities para que las
-- propiedades existentes partan con las amenidades de su categoría.

CREATE TABLE "property_amenities" (
    "property_id" TEXT NOT NULL,
    "amenity_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "property_amenities_pkey" PRIMARY KEY ("property_id","amenity_id")
);

CREATE INDEX "property_amenities_tenant_id_idx" ON "property_amenities"("tenant_id");
CREATE INDEX "property_amenities_amenity_id_idx" ON "property_amenities"("amenity_id");

ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "property_amenities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "property_amenities"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

INSERT INTO "property_amenities" ("property_id", "amenity_id", "tenant_id")
SELECT p."id", ca."amenity_id", p."tenant_id"
FROM "properties" p
JOIN "category_amenities" ca ON ca."category_id" = p."category_id"
ON CONFLICT ("property_id", "amenity_id") DO NOTHING;