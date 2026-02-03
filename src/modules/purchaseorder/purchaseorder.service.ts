import { Decimal } from "@prisma/client/runtime/client";
import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { prisma } from "../../util/prisma";
import {
  CreatePurchaseOrderInput,
  DeletePurchaseOrderInput,
  GetPurchaseOrderByIdInput,
  UpdatePurchaseOrderInput,
  UpdatePurchaseOrderParamsInput,
} from "./purchaseorder.schema";

async function findById(id: GetPurchaseOrderByIdInput["id"]) {
  return await prisma.purchaseOrder.findUnique({
    where: {
      id,
    },
    include: {
      items: true,
    },
  });
}

export async function getPurchaseOrderById(
  id: GetPurchaseOrderByIdInput["id"],
) {
  const order = await findById(id);

  if (!order)
    throw new AppError(
      404,
      "Order not found with this id",
      ERROR_CODE.NOT_FOUND,
    );

  return order;
}

export async function getAllPurchaseOrders() {
  return await prisma.purchaseOrder.findMany();
}

export async function createPurchaseOrder(
  requestingAdminId: string,
  data: CreatePurchaseOrderInput,
) {
  if (requestingAdminId !== data.adminId)
    throw new AppError(
      403,
      "Unauthorized: cannot create purchase order for another admin.",
      ERROR_CODE.UNAUTHORIZED,
    );

  const supplier = await prisma.supplier.findUnique({
    where: {
      id: data.supplierId,
    },
  });

  if (!supplier)
    throw new AppError(
      404,
      "Supplier of this ID not found",
      ERROR_CODE.NOT_FOUND,
    );

  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError(
      404,
      "One or more products not found",
      ERROR_CODE.NOT_FOUND,
    );
  }

  const itemQuantity = data.items.map((item) => ({
    id: item.productId,
    quantity: item.quantity,
  }));

  const total = products.reduce((sum, prod) => {
    const item = itemQuantity.find((i) => i.id === prod.id);
    return sum + item!.quantity * prod.unitPrice.toNumber();
  }, 0);

  const order = await prisma.purchaseOrder.create({
    data: {
      adminId: data.adminId,
      supplierId: data.supplierId,
      orderDate: data.orderDate || new Date(),
      arrived: data.arrived || false,
      totalAmount: new Decimal(total),
      items: {
        createMany: {
          data: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
        },
      },
    },
    include: {
      items: true,
    },
  });

  return order;
}

export async function updatePurchaseOrder(
  requestingAdminId: string,
  id: UpdatePurchaseOrderParamsInput["id"],
  data: UpdatePurchaseOrderInput,
) {
  if (requestingAdminId !== data.adminId)
    throw new AppError(
      403,
      "Unauthorized: cannot update purchase order for another admin.",
      ERROR_CODE.UNAUTHORIZED,
    );

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!purchaseOrder) {
    throw new AppError(404, "Purchase order not found", ERROR_CODE.NOT_FOUND);
  }

  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError(
      404,
      "One or more products not found",
      ERROR_CODE.NOT_FOUND,
    );
  }

  const total = data.items.reduce((sum, item) => {
    return sum + item.quantity * Number(item.unitPrice);
  }, 0);

  return await prisma.purchaseOrder.update({
    where: { id },
    data: {
      adminId: data.adminId,
      supplierId: data.supplierId,
      orderDate: data.orderDate,
      arrived: data.arrived,
      totalAmount: new Decimal(total),
      items: {
        deleteMany: {},
        createMany: {
          data: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
        },
      },
    },
    include: {
      items: true,
    },
  });
}

export async function orderArrived(id: UpdatePurchaseOrderParamsInput["id"]) {
  const exisitingOrder = await findById(id);

  if (!exisitingOrder)
    throw new AppError(
      404,
      "Order not found with this id",
      ERROR_CODE.NOT_FOUND,
    );

  if (exisitingOrder.arrived)
    throw new AppError(
      400,
      "Order already marked as arrived",
      ERROR_CODE.INVALID_STATE,
    );

  return await prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.update({
      where: {
        id,
      },
      data: {
        arrived: true,
      },
      include: {
        items: true,
      },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }

    return order;
  });
}

export async function deletePurchaseOrder(id: DeletePurchaseOrderInput["id"]) {
  const order = await findById(id);

  if (!order)
    throw new AppError(
      404,
      "Order not found with this id",
      ERROR_CODE.NOT_FOUND,
    );

  await prisma.purchaseOrder.delete({
    where: {
      id,
    },
  });

  return true;
}
