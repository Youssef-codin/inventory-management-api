import { Decimal } from '@prisma/client/runtime/client';
import { createAdmin } from '../modules/admin/admin.service';
import { createCustomerOrder } from '../modules/customerorder/customerorder.service';
import { createProduct } from '../modules/product/product.service';
import { createPurchaseOrder } from '../modules/purchaseorder/purchaseorder.service';
import { createShop } from '../modules/shop/shop.service';
import { createSupplier } from '../modules/supplier/supplier.service';
import { prisma } from './prisma';

export async function seedDemo() {
    console.log('Clearing database...');
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.customerOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.customerOrder.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.shop.deleteMany();
    console.log('Database cleared.');

    // ── Shops ────────────────────────────────────────────────────────────
    console.log('Seeding shops...');
    const shop1 = await createShop({ name: 'Downtown Store', address: '10 Main St, New York, NY' });
    const shop2 = await createShop({ name: 'Airport Branch', address: '500 Terminal Rd, JFK, NY' });

    // ── Admin ────────────────────────────────────────────────────────────
    console.log('Seeding admin...');
    const admin = await createAdmin({
        username: 'admin',
        password: 'admin',
    });

    // ── Suppliers ────────────────────────────────────────────────────────
    console.log('Seeding suppliers...');
    const supplier1 = await createSupplier({
        name: 'Global Tech Supplies',
        contactEmail: 'contact@globaltech.com',
        phone: '1-800-555-0199',
        address: '123 Tech Park, Silicon Valley, CA',
    });
    await createSupplier({
        name: 'Office Essentials Inc.',
        contactEmail: 'sales@officeessentials.com',
        phone: '1-555-012-3456',
        address: '456 Main St, Springfield, IL',
    });

    // ── Products (with per-shop inventory) ───────────────────────────────
    console.log('Seeding products...');
    const laptop = await createProduct({
        name: 'Laptop Pro X',
        category: 'Electronics',
        unitPrice: new Decimal(1299.99),
        reorderLevel: 10,
        inventories: [
            { shopId: shop1.id, quantity: 50 },
            { shopId: shop2.id, quantity: 25 },
        ],
    });
    const mouse = await createProduct({
        name: 'Wireless Mouse',
        category: 'Accessories',
        unitPrice: new Decimal(29.99),
        reorderLevel: 20,
        inventories: [
            { shopId: shop1.id, quantity: 100 },
            { shopId: shop2.id, quantity: 60 },
        ],
    });
    await createProduct({
        name: 'Ergonomic Chair',
        category: 'Furniture',
        unitPrice: new Decimal(349.5),
        reorderLevel: 5,
        inventories: [
            { shopId: shop1.id, quantity: 15 },
            { shopId: shop2.id, quantity: 8 },
        ],
    });
    await createProduct({
        name: 'USB-C Hub',
        category: 'Accessories',
        unitPrice: new Decimal(49.99),
        reorderLevel: 15,
        inventories: [
            { shopId: shop1.id, quantity: 200 },
            { shopId: shop2.id, quantity: 75 },
        ],
    });
    await createProduct({
        name: 'Standing Desk',
        category: 'Furniture',
        unitPrice: new Decimal(599.0),
        reorderLevel: 3,
        inventories: [
            { shopId: shop1.id, quantity: 10 },
            { shopId: shop2.id, quantity: 4 },
        ],
    });

    // ── Purchase Order ───────────────────────────────────────────────────
    console.log('Seeding purchase orders...');
    await createPurchaseOrder(admin.id, {
        adminId: admin.id,
        supplierId: supplier1.id,
        shopId: shop1.id,
        orderDate: new Date(),
        arrived: true,
        items: [
            { productId: laptop.id, quantity: 10, unitPrice: 1000.0 },
            { productId: mouse.id, quantity: 50, unitPrice: 15.0 },
        ],
    });

    // ── Customer Order ───────────────────────────────────────────────────
    console.log('Seeding customer orders...');
    await createCustomerOrder(admin.id, {
        adminId: admin.id,
        shopId: shop1.id,
        orderDate: new Date(),
        items: [
            { productId: laptop.id, quantity: 2, unitPrice: new Decimal(1299.99) },
            { productId: mouse.id, quantity: 5, unitPrice: new Decimal(29.99) },
        ],
    });

    console.log('Demo seed complete.');
}

