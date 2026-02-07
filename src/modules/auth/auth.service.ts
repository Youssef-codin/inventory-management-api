import { AppError } from '../../errors/AppError';
import { ERROR_CODE } from '../../middleware/errorHandler';
import { comparePass, makeJWT } from '../../util/auth';
import { prisma } from '../../util/prisma';
import type { CredentialsInput } from './auth.schema';

export async function login(creds: CredentialsInput) {
    const user = await prisma.admin.findUnique({
        where: {
            username: creds.username,
        },
    });

    if (!user || !(await comparePass(creds.password, user.passwordHash)))
        throw new AppError(401, 'Invalid credentials', ERROR_CODE.INVALID_CREDENTIALS);

    return makeJWT(user.id, user.username);
}
