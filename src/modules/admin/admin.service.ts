import { AppError } from "../../errors/AppError";
import { ERROR_CODE } from "../../middleware/errorHandler";
import { hashPassword } from "../../util/auth";
import { prisma } from "../../util/prisma";
import { CreateAdminInput, DeleteAdminInput, GetAdminByIdInput, UpdateAdminInput, UpdateAdminParamsInput } from "./admin.schema";

async function findById(id: GetAdminByIdInput['id']) {
    return await prisma.admin.findUnique({
        where: {
            id
        }
    });
}

export async function getAdminById(id: GetAdminByIdInput['id']) {
    const admin = await prisma.admin.findUnique({
        where: {
            id
        }, omit: {
            passwordHash: true,
        }
    });

    if (!admin)
        throw new AppError(404, "Admin Not Found", ERROR_CODE.NOT_FOUND);

    return admin;
}

export async function getAdminByName(username: string) {
    return await prisma.admin.findMany({
        where: {
            username: {
                contains: username,
                mode: "insensitive"
            }
        }, omit: {
            passwordHash: true
        }
    });
}

export async function getAllAdmins() {
    return await prisma.admin.findMany({
        omit: {
            passwordHash: true
        }
    });
}

export async function createAdmin(data: CreateAdminInput) {
    const exists = await prisma.admin.findUnique({
        where: {
            username: data.username,
        }
    });

    if (exists)
        throw new AppError(409, "Username is already taken", ERROR_CODE.USERNAME_TAKEN)

    return await prisma.admin.create({
        data: {
            username: data.username,
            passwordHash: await hashPassword(data.password)
        },
        omit: {
            passwordHash: true
        }
    });
}

export async function updateAdmin(id: UpdateAdminParamsInput['id'], data: UpdateAdminInput) {
    const exists = await findById(id);

    if (!exists)
        throw new AppError(404, "Admin with this Id does not exist", ERROR_CODE.NOT_FOUND)

    return await prisma.admin.update({
        where: {
            id
        }, data: {
            username: data.username,
            passwordHash: await hashPassword(data.password)
        }, omit: {
            passwordHash: true
        }
    });
}


export async function deleteAdmin(id: DeleteAdminInput['id']) {
    const exists = await findById(id);

    if (!exists)
        throw new AppError(404, "Admin with this Id does not exist", ERROR_CODE.NOT_FOUND)

    await prisma.admin.delete({
        where: {
            id
        }
    });

    return true;
}
