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

const CATEGORIES = [
    'Electronics',
    'Furniture',
    'Accessories',
    'Office Supplies',
    'Software',
    'Peripherals',
    'Storage',
    'Networking',
];
const PRODUCT_PREFIXES = [
    'Laptop',
    'Desktop',
    'Monitor',
    'Keyboard',
    'Mouse',
    'Headset',
    'Webcam',
    'Speaker',
    'Printer',
    'Scanner',
    'Router',
    'Switch',
    'Cable',
    'Adapter',
    'Dock',
    'Hub',
    'Drive',
    'SSD',
    'HDD',
    'RAM',
];
const PRODUCT_SUFFIXES = [
    'Pro',
    'Plus',
    'Ultra',
    'Max',
    'Mini',
    'Lite',
    'Standard',
    'Premium',
    'Basic',
    'Advanced',
];

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProductName(): string {
    const prefix = randomElement(PRODUCT_PREFIXES);
    const suffix = randomElement(PRODUCT_SUFFIXES);
    const num = randomBetween(1, 9999);
    return `${prefix} ${suffix} ${num}`;
}

export async function seedLarge() {
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

    console.log('Seeding 10 shops...');
    const shops = [];
    for (let i = 1; i <= 10; i++) {
        shops.push(
            await createShop({
                name: `Store ${i}`,
                address: `${randomBetween(1, 999)} Main St, City ${i}, State ${String.fromCharCode(65 + (i % 26))}`,
            }),
        );
    }

    console.log('Seeding admin...');
    const admin = await createAdmin({
        username: 'admin',
        password: 'admin',
    });

    console.log('Seeding 50 suppliers...');
    const suppliers = [];
    for (let i = 1; i <= 50; i++) {
        suppliers.push(
            await createSupplier({
                name: `Supplier ${i} Inc.`,
                contactEmail: `contact${i}@supplier.com`,
                phone: `555-${String(i).padStart(4, '0')}`,
                address: `${randomBetween(1, 999)} Industrial Blvd, City ${i}`,
            }),
        );
    }

    console.log('Seeding 1000 products...');
    const products = [];
    for (let i = 1; i <= 1000; i++) {
        const product = await createProduct({
            name: generateProductName(),
            category: randomElement(CATEGORIES),
            unitPrice: new Decimal(randomBetween(5, 5000) + Math.random()),
            reorderLevel: randomBetween(5, 50),
            inventories: shops.map((shop) => ({
                shopId: shop.id,
                quantity: randomBetween(1, 500),
            })),
        });
        products.push(product);
        if (i % 100 === 0) console.log(`  Created ${i}/1000 products...`);
    }

    console.log('Seeding purchase orders...');
    for (let i = 0; i < 50; i++) {
        const shop = shops[i % shops.length];
        const supplier = suppliers[i % suppliers.length];
        const startIdx = (i * 11) % products.length;
        const items = [];
        const itemCount = Math.min(randomBetween(1, 5), products.length);
        for (let j = 0; j < itemCount; j++) {
            const p = products[(startIdx + j) % products.length];
            items.push({
                productId: p.id,
                quantity: randomBetween(1, 50),
                unitPrice: Number(p.unitPrice) * 0.8,
            });
        }
        await createPurchaseOrder(admin.id, {
            adminId: admin.id,
            supplierId: supplier.id,
            shopId: shop.id,
            orderDate: new Date(Date.now() - randomBetween(0, 30) * 24 * 60 * 60 * 1000),
            arrived: Math.random() > 0.2,
            items,
        });
    }
    console.log('  Created 50 purchase orders.');

    console.log('Seeding customer orders...');
    for (let i = 0; i < 100; i++) {
        const shop = shops[i % shops.length];
        const startIdx = (i * 7) % products.length;
        const items = [];
        const itemCount = Math.min(randomBetween(1, 5), products.length);
        for (let j = 0; j < itemCount; j++) {
            const p = products[(startIdx + j) % products.length];
            items.push({
                productId: p.id,
                quantity: randomBetween(
                    1,
                    Math.min(10, p.inventories.find((inv) => inv.shopId === shop.id)?.quantity || 100),
                ),
                unitPrice: p.unitPrice,
            });
        }
        await createCustomerOrder(admin.id, {
            adminId: admin.id,
            shopId: shop.id,
            orderDate: new Date(Date.now() - randomBetween(0, 30) * 24 * 60 * 60 * 1000),
            items,
        });
    }
    console.log('  Created 100 customer orders.');

    console.log('Large seed complete: 10 shops, 50 suppliers, 1000 products, 50 POs, 100 COs.');
}
