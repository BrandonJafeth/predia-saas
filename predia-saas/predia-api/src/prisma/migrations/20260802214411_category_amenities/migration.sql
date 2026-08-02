-- El catálogo vivo de amenidades pasa a asociarse a la categoría (tipo-de-bien),
-- así que la tabla pivote property_amenities ya no es el origen del dato.
-- Migramos las asociaciones existentes hacia la categoría antes de dropearla,
-- para no perder datos (muchos-a-muchos global category_amenities).

-- DropForeignKey
ALTER TABLE "property_amenities" DROP CONSTRAINT "property_amenities_amenity_id_fkey";

-- DropForeignKey
ALTER TABLE "property_amenities" DROP CONSTRAINT "property_amenities_property_id_fkey";

-- DropForeignKey
ALTER TABLE "property_amenities" DROP CONSTRAINT "property_amenities_tenant_id_fkey";

-- DropTable
DROP TABLE "property_amenities";

-- CreateTable
CREATE TABLE "category_amenities" (
    "category_id" TEXT NOT NULL,
    "amenity_id" TEXT NOT NULL,

    CONSTRAINT "category_amenities_pkey" PRIMARY KEY ("category_id","amenity_id")
);

-- CreateIndex
CREATE INDEX "category_amenities_amenity_id_idx" ON "category_amenities"("amenity_id");

-- AddForeignKey
ALTER TABLE "category_amenities" ADD CONSTRAINT "category_amenities_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_amenities" ADD CONSTRAINT "category_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mover amenidades que ya estaban asociadas a propiedades hacia su categoría.
INSERT INTO "category_amenities" ("category_id", "amenity_id")
SELECT DISTINCT p."category_id", pa."amenity_id"
FROM "property_amenities" pa
JOIN "properties" p ON p."id" = pa."property_id"
ON CONFLICT ("category_id", "amenity_id") DO NOTHING;