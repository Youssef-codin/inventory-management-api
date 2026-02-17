import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/customerorder/customerorder.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        shop: { findUnique: vi.fn() },
        product: { findMany: vi.fn() },
        customerOrder: { findUnique: vi.fn() },
        $transaction: vi.fn(),
    },
}));

import { prisma } from '../../src/util/prisma';

describe('Customer Order Module - Unit', () => {
    const mockAdminId = '00000000-0000-0000-0000-000000000001';
    const mockShopId = 1;
    const mockProductId = '00000000-0000-0000-0000-000000000002';
    const mockOrderId = '00000000-0000-0000-0000-000000000003';
    const mockOrderDate = new Date();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createCustomerOrder', () => {
        it('should throw 403 UNAUTHORIZED if requesting adminId does not match data.adminId', async () => {
            const otherAdminId = '00000000-0000-0000-0000-000000000099';

            await expect(
                service.createCustomerOrder(mockAdminId, {
                    adminId: otherAdminId,
                    shopId: mockShopId,
                    orderDate: mockOrderDate,
                    items: [{ productId: mockProductId, quantity: 1 }],
                }),
            ).rejects.toMatchObject({
                status: 403,
                code: ERROR_CODE.UNAUTHORIZED,
            });
        });

        it('should throw 404 NOT_FOUND if shop does not exist', async () => {
            vi.mocked(prisma.shop.findUnique).mockResolvedValue(null);

            await expect(
                service.createCustomerOrder(mockAdminId, {
                    adminId: mockAdminId,
                    shopId: 99999,
                    orderDate: mockOrderDate,
                    items: [{ productId: mockProductId, quantity: 1 }],
                }),
            ).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('updateCustomerOrder', () => {
        it('should throw 403 UNAUTHORIZED if requesting adminId does not match data.adminId', async () => {
            const otherAdminId = '00000000-0000-0000-0000-000000000099';

            await expect(
                service.updateCustomerOrder(mockAdminId, mockOrderId, {
                    adminId: otherAdminId,
                    shopId: mockShopId,
                    orderDate: mockOrderDate,
                    items: [{ productId: mockProductId, quantity: 1 }],
                }),
            ).rejects.toMatchObject({
                status: 403,
                code: ERROR_CODE.UNAUTHORIZED,
            });
        });

        it('should throw 404 NOT_FOUND if order does not exist', async () => {
            vi.mocked(prisma.customerOrder.findUnique).mockResolvedValue(null);

            await expect(
                service.updateCustomerOrder(mockAdminId, mockOrderId, {
                    adminId: mockAdminId,
                    shopId: mockShopId,
                    orderDate: mockOrderDate,
                    items: [{ productId: mockProductId, quantity: 1 }],
                }),
            ).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('getCustomerOrderById', () => {
        it('should throw 404 NOT_FOUND if order does not exist', async () => {
            vi.mocked(prisma.customerOrder.findUnique).mockResolvedValue(null);

            await expect(service.getCustomerOrderById(mockOrderId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('deleteCustomerOrder', () => {
        it('should throw 404 NOT_FOUND if order does not exist', async () => {
            vi.mocked(prisma.customerOrder.findUnique).mockResolvedValue(null);

            await expect(service.deleteCustomerOrder(mockOrderId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });
});
