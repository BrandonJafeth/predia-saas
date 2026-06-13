-- CreateTable
CREATE TABLE "tenant_sites" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "custom_domain" TEXT,
    "allowed_origins" TEXT,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "font_family" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_sites_tenant_id_key" ON "tenant_sites"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_sites_tenant_id_idx" ON "tenant_sites"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_sites" ADD CONSTRAINT "tenant_sites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
