import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { comparePass, makeJWT } from '../../util/auth';
import { prisma } from '../../util/prisma';
import type { CredentialsInput } from './auth.schema';

// Dummy hash for timing attack prevention
const DUMMY_HASH = '$2b$10$dummyhashfordummyhashfordummyhashfordumm';

export async function login(creds: CredentialsInput) {
    const user = await prisma.admin.findUnique({
        where: {
            username: creds.username,
        },
    });

    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isValid = await comparePass(creds.password, hashToCompare);

    if (!user || !isValid) {
        throw new AppError(401, 'Invalid credentials', ERROR_CODE.INVALID_CREDENTIALS);
    }

    return makeJWT(user.id, user.username);
}
