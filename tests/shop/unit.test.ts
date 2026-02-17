import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/shop/shop.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        shop: { findUnique: vi.fn() },
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
});
