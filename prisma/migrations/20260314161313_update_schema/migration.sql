/*
  Warnings:

  - You are about to drop the column `district_id` on the `pois` table. All the data in the column will be lost.
  - You are about to drop the column `is_open` on the `pois` table. All the data in the column will be lost.
  - You are about to drop the `districts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `owner_id` to the `pois` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "POIStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "pois" DROP CONSTRAINT "pois_district_id_fkey";

-- DropIndex
DROP INDEX "pois_district_id_slug_key";

-- AlterTable
ALTER TABLE "pois" DROP COLUMN "district_id",
DROP COLUMN "is_open",
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" UUID,
ADD COLUMN     "owner_id" UUID NOT NULL,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" "POIStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submitCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" UUID,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'APPROVED';

-- DropTable
DROP TABLE "districts";

-- CreateIndex
CREATE INDEX "pois_status_idx" ON "pois"("status");

-- AddForeignKey
ALTER TABLE "pois" ADD CONSTRAINT "pois_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
