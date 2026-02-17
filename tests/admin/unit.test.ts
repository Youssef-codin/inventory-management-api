import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODE } from '../../src/middleware/errorHandler';
import * as service from '../../src/modules/admin/admin.service';

vi.mock('../../src/util/prisma', () => ({
    prisma: {
        admin: { findUnique: vi.fn() },
    },
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
});
