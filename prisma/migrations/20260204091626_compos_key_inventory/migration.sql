/*
  Warnings:

  - The primary key for the `Inventory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Inventory` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Inventory_productId_idx";

-- DropIndex
DROP INDEX "Inventory_productId_shopId_key";

-- DropIndex
DROP INDEX "Inventory_shopId_idx";

-- AlterTable
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Inventory_pkey" PRIMARY KEY ("productId", "shopId");
