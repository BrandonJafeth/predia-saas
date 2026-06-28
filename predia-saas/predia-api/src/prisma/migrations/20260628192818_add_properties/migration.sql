-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('sale', 'rent', 'lease');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('draft', 'active', 'inactive', 'sold', 'rented');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(15,2) NOT NULL,
    "operation_type" "OperationType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'draft',
    "area" DECIMAL(10,2),
    "location_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_tenant_id_idx" ON "properties"("tenant_id");

-- CreateIndex
CREATE INDEX "properties_tenant_id_is_published_idx" ON "properties"("tenant_id", "is_published");

-- CreateIndex
CREATE INDEX "properties_tenant_id_price_idx" ON "properties"("tenant_id", "price");

-- CreateIndex
CREATE INDEX "properties_tenant_id_location_id_idx" ON "properties"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "properties_attributes_idx" ON "properties" USING GIN ("attributes");

-- CreateIndex
CREATE UNIQUE INDEX "properties_tenant_id_slug_key" ON "properties"("tenant_id", "slug");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
