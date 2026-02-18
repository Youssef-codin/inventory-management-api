import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/admin/admin.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        admin: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    },
}));

vi.mock('../../src/util/auth', () => ({
    hashPassword: vi.fn((pwd: string) => Promise.resolve(`hashed_${pwd}`)),
}));

import { prisma } from '../../src/util/prisma';

describe('Admin Module - Unit', () => {
    const mockAdminId = '00000000-0000-0000-0000-000000000001';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAdminById', () => {
        it('should throw 404 NOT_FOUND if admin does not exist', async () => {
            vi.mocked(prisma.admin.findUnique).mockResolvedValue(null);

            await expect(service.getAdminById(mockAdminId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('deleteAdmin', () => {
        it('should throw 404 NOT_FOUND if admin does not exist', async () => {
            vi.mocked(prisma.admin.findUnique).mockResolvedValue(null);

            await expect(service.deleteAdmin(mockAdminId)).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });

    describe('createAdmin', () => {
        it('should create admin with hashed password', async () => {
            vi.mocked(prisma.admin.findUnique).mockResolvedValue(null);
            const mockAdmin = { id: mockAdminId, username: 'newadmin' };
            vi.mocked(prisma.admin.create).mockResolvedValue(mockAdmin as any);

            const result = await service.createAdmin({ username: 'newadmin', password: 'password123' });

            expect(result.username).toBe('newadmin');
            expect(prisma.admin.create).toHaveBeenCalledWith({
                data: {
                    username: 'newadmin',
                    passwordHash: 'hashed_password123',
                },
                omit: { passwordHash: true },
            });
        });

        it('should throw 409 USERNAME_TAKEN if username already exists', async () => {
            vi.mocked(prisma.admin.findUnique).mockResolvedValue({
                id: 'existing-id',
                username: 'taken',
            } as any);

            await expect(
                service.createAdmin({ username: 'taken', password: 'password123' }),
            ).rejects.toMatchObject({
                status: 409,
                code: ERROR_CODE.USERNAME_TAKEN,
            });
        });
    });

    describe('updateAdmin', () => {
        it('should update admin with hashed password', async () => {
            const existingAdmin = { id: mockAdminId, username: 'oldname' };
            const updatedAdmin = { id: mockAdminId, username: 'newname' };

            vi.mocked(prisma.admin.findUnique).mockResolvedValue(existingAdmin as any);
            vi.mocked(prisma.admin.update).mockResolvedValue(updatedAdmin as any);

            const result = await service.updateAdmin(mockAdminId, {
                username: 'newname',
                password: 'newpassword123',
            });

            expect(result.username).toBe('newname');
            expect(prisma.admin.update).toHaveBeenCalledWith({
                where: { id: mockAdminId },
                data: {
                    username: 'newname',
                    passwordHash: 'hashed_newpassword123',
                },
                omit: { passwordHash: true },
            });
        });

        it('should throw 404 NOT_FOUND if admin does not exist', async () => {
            vi.mocked(prisma.admin.findUnique).mockResolvedValue(null);

            await expect(
                service.updateAdmin(mockAdminId, { username: 'newname', password: 'password123' }),
            ).rejects.toMatchObject({
                status: 404,
                code: ERROR_CODE.NOT_FOUND,
            });
        });
    });
});
