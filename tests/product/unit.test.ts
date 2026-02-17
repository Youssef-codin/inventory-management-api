import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/product/product.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        product: { findUnique: vi.fn() },
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
});
