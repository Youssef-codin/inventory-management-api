import { Decimal } from '@prisma/client/runtime/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/product/product.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
        inventory: { findUnique: vi.fn(), update: vi.fn() },
        $transaction: vi.fn(),
    },
}));

import { prisma } from '../../src/util/prisma';

describe('Product Module - Unit', () => {
    const mockProductId = '00000000-0000-0000-0000-000000000001';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProductById', () => {
        it('should throw 404 NOT_FOUND if product does not exist', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

            await expect(service.getProductById(mockProductId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('deleteProduct', () => {
        it('should throw 404 NOT_FOUND if product does not exist', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

            await expect(service.deleteProduct(mockProductId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('createProduct', () => {
        it('should create product with inventory', async () => {
            const mockProduct = {
                id: mockProductId,
                name: 'Test Product',
                category: 'Test',
                unitPrice: new Decimal(10.5),
                reorderLevel: 5,
            };
            vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

            const result = await service.createProduct({
                name: 'Test Product',
                category: 'Test',
                unitPrice: new Decimal(10.5),
                reorderLevel: 5,
                inventories: [{ shopId: 1, quantity: 10 }],
            });

            expect(result.name).toBe('Test Product');
            expect(prisma.product.create).toHaveBeenCalled();
        });
    });

    describe('updateProduct', () => {
        it('should throw 404 NOT_FOUND if product does not exist', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

            await expect(
                service.updateProduct(mockProductId, {
                    name: 'Updated',
                    category: 'C',
                    unitPrice: new Decimal(15),
                    reorderLevel: 3,
                    inventories: [{ shopId: 1, quantity: 5 }],
                }),
            ).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('patchProductStock', () => {
        it('should throw 404 NOT_FOUND if product does not exist', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

            await expect(service.patchProductStock(mockProductId, 1, 20)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });
});
