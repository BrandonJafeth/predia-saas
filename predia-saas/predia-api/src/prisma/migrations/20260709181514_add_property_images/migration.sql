-- CreateTable
CREATE TABLE "property_images" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_images_property_id_position_idx" ON "property_images"("property_id", "position");

-- CreateIndex
CREATE INDEX "property_images_tenant_id_idx" ON "property_images"("tenant_id");

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
