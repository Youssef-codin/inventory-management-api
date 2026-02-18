import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/purchaseorder/purchaseorder.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        purchaseOrder: { findUnique: vi.fn() },
        $transaction: vi.fn(),
    },
}));

import { prisma } from '../../src/util/prisma';

describe('Purchase Order Module - Unit', () => {
    const mockAdminId = '00000000-0000-0000-0000-000000000001';
    const mockShopId = 1;
    const mockSupplierId = '00000000-0000-0000-0000-000000000002';
    const mockProductId = '00000000-0000-0000-0000-000000000003';
    const mockOrderId = '00000000-0000-0000-0000-000000000004';
    const mockOrderDate = new Date();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPurchaseOrderById', () => {
        it.todo('should throw 404 NOT_FOUND if order does not exist', async () => {
            vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null);

            await expect(service.getPurchaseOrderById(mockOrderId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('deletePurchaseOrder', () => {
        it.todo('should throw 404 NOT_FOUND if order does not exist', async () => {
            vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null);

            await expect(service.deletePurchaseOrder(mockOrderId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });
});
