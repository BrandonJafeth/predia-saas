/*
  Warnings:

  - You are about to drop the column `area` on the `properties` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('CRC', 'USD');

-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_location_id_fkey";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "area",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "built_area_m2" DECIMAL(10,2),
ADD COLUMN     "currency" "CurrencyCode" NOT NULL DEFAULT 'CRC',
ADD COLUMN     "lat" DECIMAL(10,6),
ADD COLUMN     "lng" DECIMAL(10,6),
ADD COLUMN     "lot_area_m2" DECIMAL(10,2),
ADD COLUMN     "subtype" TEXT,
ALTER COLUMN "location_id" DROP NOT NULL,
ALTER COLUMN "agent_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
