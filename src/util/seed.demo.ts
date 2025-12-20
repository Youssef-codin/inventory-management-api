import { createAdmin } from "../modules/admin/admin.service";
import { createProduct } from "../modules/product/product.service";
import { createSupplier } from "../modules/supplier/supplier.service";
import { createPurchaseOrder } from "../modules/purchaseorder/purchaseorder.service";
import { createCustomerOrder } from "../modules/customerorder/customerorder.service";
import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/client";

export async function seedDemo() {
    console.log("Clearing database...");
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.customerOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.customerOrder.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    // Ideally we might keep the admin, or recreate it. 
    // If we delete admin, we must recreate.
    // Let's delete to be thorough.
    await prisma.admin.deleteMany();
    console.log("Database cleared.");

    console.log("Seeding admin...");
    const admin = await createAdmin({
        username: "admin",
        password: "admin" // Demo password
    });

    console.log("Seeding suppliers...");
    await createSupplier({
        name: "Global Tech Supplies",
        contactEmail: "contact@globaltech.com",
        phone: "1-800-555-0199",
        address: "123 Tech Park, Silicon Valley, CA"
    });
    await createSupplier({
        name: "Office Essentials Inc.",
        contactEmail: "sales@officeessentials.com",
        phone: "1-555-012-3456",
        address: "456 Main St, Springfield, IL"
    });

    console.log("Seeding products...");
    await createProduct({
        name: "Laptop Pro X",
        category: "Electronics",
        unitPrice: new Decimal(1299.99),
        reorderLevel: 10,
        stockQuantity: 50
    });
    await createProduct({
        name: "Wireless Mouse",
        category: "Accessories",
        unitPrice: new Decimal(29.99),
        reorderLevel: 20,
        stockQuantity: 100
    });
    await createProduct({
        name: "Ergonomic Chair",
        category: "Furniture",
        unitPrice: new Decimal(349.50),
        reorderLevel: 5,
        stockQuantity: 15
    });

    console.log("Seeding purchase orders...");
    const supplier = await prisma.supplier.findFirst();
    const product = await prisma.product.findFirst();

    if (admin && supplier && product) {
        await createPurchaseOrder(admin.id, {
            adminId: admin.id,
            supplierId: supplier.id,
            orderDate: new Date(),
            arrived: true,
            items: [
                {
                    productId: product.id,
                    quantity: 10,
                    unitPrice: new Decimal(1000.00) // Buying at cost
                }
            ]
        });
    }

    console.log("Seeding customer orders...");
    // Fetch again just in case order matters or multiple exist
    const productForCust = await prisma.product.findFirst();

    if (admin && productForCust) {
        await createCustomerOrder(admin.id, {
            adminId: admin.id,
            orderDate: new Date(),
            items: [
                {
                    productId: productForCust.id,
                    quantity: 2
                }
            ]
        });
    }
    console.log("Demo seed complete.");
}
