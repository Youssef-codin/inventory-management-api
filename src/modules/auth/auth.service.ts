import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { comparePass, hashPassword, makeJWT } from "../../util/auth";
import { prisma } from "../../util/prisma";
import { CredentialsInput } from "./auth.schema";

export async function login(creds: CredentialsInput) {
    const user = await prisma.admin.findUnique({
        where: {
            username: creds.username
        }
    })

    if (!user || !await comparePass(creds.password, user.passwordHash))
        throw new AppError(401, "Invalid credentials", ERROR_CODE.INVALID_CREDENTIALS);

    return makeJWT(user.id, user.username);
}

export async function register(creds: CredentialsInput) {
    const exists = await prisma.admin.findUnique({
        where: {
            username: creds.username,
        }
    });

    if (exists != null)
        throw new AppError(400, "Username is already taken", ERROR_CODE.USERNAME_TAKEN)

    return await prisma.admin.create({
        data: {
            username: creds.username,
            passwordHash: await hashPassword(creds.password)
        },
        omit: {
            passwordHash: true
        }
    });
}
