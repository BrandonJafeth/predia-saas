/*
  Warnings:

  - Added the required column `public_id` to the `property_images` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "max_images_per_property" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "property_images" ADD COLUMN     "public_id" TEXT NOT NULL;
