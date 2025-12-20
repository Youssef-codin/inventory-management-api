import { CreateAdminInput } from "../modules/admin/admin.schema";
import { createAdmin } from "../modules/admin/admin.service";
import { prisma } from "./prisma";

export async function initDb() {
    if (await prisma.admin.count() <= 0) {
        const adminData: CreateAdminInput = {
            username: "admin",
            password: "admin"
        };

        await createAdmin(adminData);
        console.log("Seeded admin user.");
    }
}