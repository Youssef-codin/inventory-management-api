import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDb, createTestAdmin, getAuthToken } from '../helpers';
import { prisma } from '../../src/util/prisma';

describe('Product Module', () => {
    let authToken: string;
    let shopId: number;

    beforeEach(async () => {
        await resetDb();
        const admin = await createTestAdmin();
        authToken = getAuthToken(admin.id, admin.username);

        // Create a test shop
        const shop = await prisma.shop.create({
            data: { name: 'Test Shop', address: '123 Test St' },
        });
        shopId = shop.id;
    });

    afterAll(async () => {
        await resetDb();
    });

    describe('GET /product', () => {
        it('should return 200 and list of products', async () => {
            // Create products with inventory
            await prisma.product.create({
                data: {
                    name: 'P1',
                    category: 'C1',
                    unitPrice: 10.5,
                    inventories: {
                        create: { shopId, quantity: 5 },
                    },
                },
            });
            await prisma.product.create({
                data: {
                    name: 'P2',
                    category: 'C2',
                    unitPrice: 20.0,
                    inventories: {
                        create: { shopId, quantity: 10 },
                    },
                },
            });

            const response = await request(app).get('/product').set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data.some((p: any) => p.name === 'P1')).toBe(true);
            expect(response.body.data.some((p: any) => p.name === 'P2')).toBe(true);
        });
    });

    describe('POST /product/add', () => {
        it('should create product with valid data', async () => {
            const response = await request(app)
                .post('/product/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'New Product',
                    category: 'Test',
                    unitPrice: 99.99,
                    reorderLevel: 5,
                    inventories: [{ shopId, quantity: 0 }],
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.unitPrice).toBe('99.99');

            // Verify inventory creation
            const inv = await prisma.inventory.findUnique({
                where: {
                    productId_shopId: {
                        productId: response.body.data.id,
                        shopId,
                    },
                },
            });
            expect(inv).not.toBeNull();
            expect(inv?.quantity).toBe(0);
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/product/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Missing Fields',
                    // missing category, unitPrice, inventory...
                });
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
            expect(response.status).toBe(400);
        });

        it('should return 400 for negative values', async () => {
            const response = await request(app)
                .post('/product/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Negative Price',
                    category: 'Test',
                    unitPrice: -10,
                    reorderLevel: 5,
                    inventories: [{ shopId, quantity: 10 }],
                });

            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
            expect(response.status).toBe(400);
        });

        it('should return 400 for missing inventories', async () => {
            const response = await request(app)
                .post('/product/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'New Product',
                    category: 'Test',
                    unitPrice: 99.99,
                    reorderLevel: 5,
                });
        });
    });

    describe('GET /product/:id', () => {
        it('should return 200 for existing product', async () => {
            const product = await prisma.product.create({
                data: {
                    name: 'P',
                    category: 'C',
                    unitPrice: 10,
                    inventories: { create: { shopId, quantity: 5 } },
                },
            });

            const response = await request(app)
                .get(`/product/${product.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(product.id);
        });

        it('should return 404 for non-existent product', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/product/${uuid}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);
        });

        it('should return 400 for invalid UUID', async () => {
            const response = await request(app)
                .get(`/product/invalid-uuid`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
            expect(response.status).toBe(400);
        });
    });

    describe('PUT /product/:id', () => {
        it('should return 200 and update fields', async () => {
            const product = await prisma.product.create({
                data: {
                    name: 'Old',
                    category: 'C',
                    unitPrice: 10,
                    reorderLevel: 1,
                    inventories: { create: { shopId, quantity: 5 } },
                },
            });

            const response = await request(app)
                .put(`/product/${product.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'New',
                    category: 'C',
                    unitPrice: 15.5,
                    reorderLevel: 2,
                    inventories: [{ shopId, quantity: 10 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('New');
            expect(response.body.data.unitPrice).toBe('15.5');

            // Verify inventory update in DB
            const inv = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: product.id, shopId } },
            });
            expect(inv?.quantity).toBe(10);
        });

        it('should return 400 for invalid payload', async () => {
            const product = await prisma.product.create({
                data: { name: 'P', category: 'C', unitPrice: 10 },
            });
            const response = await request(app)
                .put(`/product/${product.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ unitPrice: 'invalid' });
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /product/:id', () => {
        it('should return 204 for existing product', async () => {
            const product = await prisma.product.create({
                data: { name: 'DeleteMe', category: 'C', unitPrice: 10 },
            });

            const response = await request(app)
                .delete(`/product/${product.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);

            const check = await prisma.product.findUnique({ where: { id: product.id } });
            expect(check).toBeNull();
        });

        it('should return 404 for non-existent product', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .delete(`/product/${uuid}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);
        });
    });

    describe('GET /product/search', () => {
        it('should return matching products', async () => {
            await prisma.product.create({ data: { name: 'SearchTarget', category: 'C', unitPrice: 10 } });
            const response = await request(app)
                .get('/product/search?name=Target')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('SearchTarget');
        });
    });

    describe('GET /product/low-stock', () => {
        it('should return 200 and only products with stockQuantity <= reorderLevel', async () => {
            await prisma.product.create({
                data: {
                    name: 'Low Stock Product',
                    category: 'Test',
                    unitPrice: 10,
                    reorderLevel: 5,
                    inventories: { create: { shopId, quantity: 2 } },
                },
            });
            await prisma.product.create({
                data: {
                    name: 'In Stock Product',
                    category: 'Test',
                    unitPrice: 20,
                    reorderLevel: 5,
                    inventories: { create: { shopId, quantity: 10 } },
                },
            });
            await prisma.product.create({
                data: {
                    name: 'Another Low Stock',
                    category: 'Test',
                    unitPrice: 15,
                    reorderLevel: 3,
                    inventories: { create: { shopId, quantity: 3 } },
                },
            });

            const response = await request(app)
                .get('/product/low-stock')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data.some((p: any) => p.productName === 'Low Stock Product')).toBe(true);
            expect(response.body.data.some((p: any) => p.productName === 'Another Low Stock')).toBe(true);
            expect(response.body.data.some((p: any) => p.productName === 'In Stock Product')).toBe(false);
        });
    });

    describe('PATCH /product/:id/stock', () => {
        it('should return 200 and update inventory quantity', async () => {
            const product = await prisma.product.create({
                data: {
                    name: 'Stock Test Product',
                    category: 'Test',
                    unitPrice: 10,
                    reorderLevel: 5,
                    inventories: { create: { shopId, quantity: 10 } },
                },
            });

            const response = await request(app)
                .patch(`/product/${product.id}/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ shopid: shopId, newQuantity: 20 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            // Response is the Inventory object
            expect(response.body.data.quantity).toBe(20);
            expect(response.body.data.shopId).toBe(shopId);
            expect(response.body.data.productId).toBe(product.id);

            const updatedInventory = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: product.id, shopId } },
            });
            expect(updatedInventory?.quantity).toBe(20);
        });

        it('should return 404 for non-existent product', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .patch(`/product/${uuid}/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ shopid: shopId, newQuantity: 15 });
            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });

        it('should return 400 for invalid product ID', async () => {
            const response = await request(app)
                .patch(`/product/invalid-uuid/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ shopid: shopId, newQuantity: 15 });
            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });

        it('should return 400 for invalid amount (negative)', async () => {
            const product = await prisma.product.create({
                data: {
                    name: 'Stock Negative Test',
                    category: 'Test',
                    unitPrice: 10,
                    reorderLevel: 5,
                    inventories: { create: { shopId, quantity: 10 } },
                },
            });

            const response = await request(app)
                .patch(`/product/${product.id}/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ shopid: shopId, newQuantity: -5 });
            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });

        it('should return 400 for invalid amount (not integer)', async () => {
            const product = await prisma.product.create({
                data: {
                    name: 'Stock Decimal Test',
                    category: 'Test',
                    unitPrice: 10,
                    reorderLevel: 5,
                    inventories: { create: { shopId, quantity: 10 } },
                },
            });

            const response = await request(app)
                .patch(`/product/${product.id}/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ shopid: shopId, newQuantity: 10.5 });
            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });
    });
});

