-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE 'archived';

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_assigned_to_fkey";

-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "assigned_to" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
