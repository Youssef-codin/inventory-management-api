import dotenv from "dotenv";
dotenv.config({ override: true });

import { prisma } from "../src/util/prisma";
import { hashPassword, makeJWT } from "../src/util/auth";

console.log("DEBUG: DATABASE_URL is", process.env.DATABASE_URL);

export async function resetDb() {
  await prisma.$transaction([
    prisma.purchaseOrderItem.deleteMany(),
    prisma.customerOrderItem.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.customerOrder.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.product.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.shop.deleteMany(),
    prisma.admin.deleteMany(),
  ]);
}

export async function createTestAdmin() {
  const passwordHash = await hashPassword('password123');
  const uniqueName = `admin_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return await prisma.admin.create({
    data: {
      username: uniqueName,
      passwordHash,
    },
  });
}

export function getAuthToken(adminId: string, username: string) {
  return makeJWT(adminId, username);
}
