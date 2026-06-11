/*
  Warnings:

  - You are about to drop the column `justification` on the `PurchaseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `PurchaseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `PurchaseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `PurchaseRequest` table. All the data in the column will be lost.
  - Added the required column `department` to the `PurchaseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endUser` to the `PurchaseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobTitle` to the `PurchaseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineManager` to the `PurchaseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objective` to the `PurchaseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operationalImpact` to the `PurchaseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterName` to the `PurchaseRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('HARDWARE', 'FURNITURE', 'SUPPLIES', 'SERVICE', 'MAINTENANCE', 'SOFTWARE', 'OTHER');

-- AlterTable
ALTER TABLE "PurchaseRequest" DROP COLUMN "justification",
DROP COLUMN "quantity",
DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "endUser" TEXT NOT NULL,
ADD COLUMN     "jobTitle" TEXT NOT NULL,
ADD COLUMN     "lineManager" TEXT NOT NULL,
ADD COLUMN     "objective" TEXT NOT NULL,
ADD COLUMN     "operationalImpact" TEXT NOT NULL,
ADD COLUMN     "otherTypeDetail" TEXT,
ADD COLUMN     "purchaseTypes" "PurchaseType"[],
ADD COLUMN     "requesterName" TEXT NOT NULL,
ALTER COLUMN "estimatedBudget" DROP NOT NULL;

-- DropEnum
DROP TYPE "RequestType";

-- CreateTable
CREATE TABLE "PurchaseRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "specifications" TEXT NOT NULL DEFAULT '',
    "desiredDeadline" TEXT NOT NULL DEFAULT '',
    "observations" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PurchaseRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_requestId_idx" ON "PurchaseRequestItem"("requestId");

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
