import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/shop/shop.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        shop: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    },
}));

import { prisma } from '../../src/util/prisma';

describe('Shop Module - Unit', () => {
    const mockShopId = 1;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getShopById', () => {
        it('should throw 404 NOT_FOUND if shop does not exist', async () => {
            vi.mocked(prisma.shop.findUnique).mockResolvedValue(null);

            await expect(service.getShopById(mockShopId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('deleteShop', () => {
        it('should throw 404 NOT_FOUND if shop does not exist', async () => {
            vi.mocked(prisma.shop.findUnique).mockResolvedValue(null);

            await expect(service.deleteShop(mockShopId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('createShop', () => {
        it('should create shop with valid data', async () => {
            const mockShop = { id: 1, name: 'Test Shop', address: 'Test Address' };
            vi.mocked(prisma.shop.create).mockResolvedValue(mockShop);

            const result = await service.createShop({ name: 'Test Shop', address: 'Test Address' });

            expect(result).toEqual(mockShop);
            expect(prisma.shop.create).toHaveBeenCalledWith({
                data: { name: 'Test Shop', address: 'Test Address' },
            });
        });
    });

    describe('updateShop', () => {
        it('should throw 404 NOT_FOUND if shop does not exist', async () => {
            vi.mocked(prisma.shop.findUnique).mockResolvedValue(null);

            await expect(
                service.updateShop(mockShopId, { name: 'Updated', address: 'Updated' }),
            ).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });

        it('should update shop when it exists', async () => {
            const existingShop = { id: mockShopId, name: 'Old Name', address: 'Old Address' };
            const updatedShop = { id: mockShopId, name: 'New Name', address: 'New Address' };

            vi.mocked(prisma.shop.findUnique).mockResolvedValue(existingShop);
            vi.mocked(prisma.shop.update).mockResolvedValue(updatedShop);

            const result = await service.updateShop(mockShopId, { name: 'New Name', address: 'New Address' });

            expect(result).toEqual(updatedShop);
            expect(prisma.shop.update).toHaveBeenCalledWith({
                where: { id: mockShopId },
                data: { name: 'New Name', address: 'New Address' },
            });
        });
    });
});
