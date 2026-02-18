import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/supplier/supplier.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        supplier: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
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

    describe('createSupplier', () => {
        it('should create supplier with valid data', async () => {
            const mockSupplier = {
                id: mockSupplierId,
                name: 'Test Supplier',
                contactEmail: 'test@supplier.com',
                phone: '1234567890',
                address: '123 Test St',
            };
            vi.mocked(prisma.supplier.create).mockResolvedValue(mockSupplier);

            const result = await service.createSupplier({
                name: 'Test Supplier',
                contactEmail: 'test@supplier.com',
                phone: '1234567890',
                address: '123 Test St',
            });

            expect(result.name).toBe('Test Supplier');
            expect(prisma.supplier.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test Supplier',
                    contactEmail: 'test@supplier.com',
                    phone: '1234567890',
                    address: '123 Test St',
                },
            });
        });
    });

    describe('updateSupplier', () => {
        it('should throw 404 NOT_FOUND if supplier does not exist', async () => {
            vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null);

            await expect(
                service.updateSupplier(mockSupplierId, {
                    name: 'Updated',
                    contactEmail: 'updated@test.com',
                    phone: '1111111111',
                    address: 'Updated Address',
                }),
            ).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });

        it('should update supplier when it exists', async () => {
            const existingSupplier = {
                id: mockSupplierId,
                name: 'Old Name',
                contactEmail: 'old@test.com',
                phone: '0000000000',
                address: 'Old Address',
            };
            const updatedSupplier = {
                id: mockSupplierId,
                name: 'New Name',
                contactEmail: 'new@test.com',
                phone: '9999999999',
                address: 'New Address',
            };

            vi.mocked(prisma.supplier.findUnique).mockResolvedValue(existingSupplier as any);
            vi.mocked(prisma.supplier.update).mockResolvedValue(updatedSupplier as any);

            const result = await service.updateSupplier(mockSupplierId, {
                name: 'New Name',
                contactEmail: 'new@test.com',
                phone: '9999999999',
                address: 'New Address',
            });

            expect(result.name).toBe('New Name');
            expect(prisma.supplier.update).toHaveBeenCalledWith({
                where: { id: mockSupplierId },
                data: {
                    name: 'New Name',
                    contactEmail: 'new@test.com',
                    phone: '9999999999',
                    address: 'New Address',
                },
            });
        });
    });
});
