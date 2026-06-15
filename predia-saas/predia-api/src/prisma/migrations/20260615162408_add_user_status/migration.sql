-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'invited', 'deactivated');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "suspended_at" TIMESTAMP(3);
