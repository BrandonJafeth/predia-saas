-- AlterTable: add unique constraint to locations.code
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");
