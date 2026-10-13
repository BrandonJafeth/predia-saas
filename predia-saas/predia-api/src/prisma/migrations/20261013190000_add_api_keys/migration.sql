-- API keys para la API pública (Fase 5).

-- CreateEnum
CREATE TYPE "ApiKeyType" AS ENUM ('publishable', 'secret');

-- CreateEnum
CREATE TYPE "ApiKeyScope" AS ENUM ('tenant', 'portal');

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ApiKeyType" NOT NULL,
    "scope" "ApiKeyScope" NOT NULL DEFAULT 'tenant',
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "allowed_origins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" TEXT,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_tenant_id_idx" ON "api_keys"("tenant_id");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS explícito (no depende del event trigger): el CRM gestiona las keys de
-- su propio tenant; la resolución de una key entrante la hace el guard con
-- SystemPrismaService.
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "api_keys";
CREATE POLICY "tenant_isolation" ON "api_keys"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
