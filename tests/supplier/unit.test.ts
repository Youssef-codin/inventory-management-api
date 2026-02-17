import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/supplier/supplier.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        supplier: { findUnique: vi.fn() },
    },
}));

import { prisma } from '../../src/util/prisma';

describe('Supplier Module - Unit', () => {
    const mockSupplierId = '00000000-0000-0000-0000-000000000001';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSupplierById', () => {
        it('should throw 404 NOT_FOUND if supplier does not exist', async () => {
            vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null);

            await expect(service.getSupplierById(mockSupplierId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('deleteSupplier', () => {
        it('should throw 404 NOT_FOUND if supplier does not exist', async () => {
            vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null);

            await expect(service.deleteSupplier(mockSupplierId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });
});
