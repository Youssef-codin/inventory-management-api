import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { prisma } from '../../src/util/prisma';
import { createTestAdmin, getAuthToken, resetDb } from '../helpers';

describe('Purchase Order Module - Integration', () => {
    let authToken: string;
    let adminId: string;
    let shopId: number;
    let prod: any;
    let supplier: any;

    beforeEach(async () => {
        await resetDb();
        const admin = await createTestAdmin();
        adminId = admin.id;
        authToken = getAuthToken(admin.id, admin.username);

        const shop = await prisma.shop.create({
            data: { name: 'Test Shop', address: '123 Test St' },
        });
        shopId = shop.id;

        prod = await prisma.product.create({
            data: {
                name: 'P',
                category: 'C',
                unitPrice: 100.0,
                reorderLevel: 5,
                inventories: { create: { shopId: shop.id, quantity: 10 } },
            },
        });

        supplier = await prisma.supplier.create({
            data: { name: 'Sup', contactEmail: 's@s.com', phone: '1', address: 'A' },
        });
    });

    describe('POST /purchase-order/', () => {
        it('should create order with arrived=true and increment inventory', async () => {
            const response = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 5, unitPrice: 80.0 }],
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            const order = response.body.data.order;

            expect(Number(order.totalAmount)).toBe(400.0); // 5 * 80

            const inv = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(inv?.quantity).toBe(15); // 10 + 5
        });

        it('should create order with arrived=false and not increment inventory', async () => {
            const response = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: false,
                    items: [{ productId: prod.id, quantity: 5, unitPrice: 80.0 }],
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            const inv = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(inv?.quantity).toBe(10); // unchanged
        });

        it('should return 404 if product not found', async () => {
            const response = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [
                        { productId: '00000000-0000-0000-0000-000000000000', quantity: 5, unitPrice: 80 },
                    ],
                });
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);
        });

        it('should include lowStockProducts in response', async () => {
            const response = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: false,
                    items: [{ productId: prod.id, quantity: 1, unitPrice: 80.0 }],
                });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('lowStockProducts');
        });

        it('should return 404 if product has no inventory in shop', async () => {
            const otherShop = await prisma.shop.create({
                data: { name: 'Other Shop', address: '456 Other St' },
            });

            const prodNoInv = await prisma.product.create({
                data: {
                    name: 'NoInv',
                    category: 'C',
                    unitPrice: 50.0,
                    reorderLevel: 5,
                },
            });

            const response = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId: otherShop.id,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prodNoInv.id, quantity: 5, unitPrice: 40.0 }],
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('GET /purchase-order/:id', () => {
        it('should return 200 and order details', async () => {
            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    items: { create: { productId: prod.id, quantity: 1, unitPrice: 100 } },
                },
            });
            const response = await request(app)
                .get(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(order.id);
        });

        it('should return 404 for non-existent order', async () => {
            const response = await request(app)
                .get('/purchase-order/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('DELETE /purchase-order/:id', () => {
        it('should delete order and items', async () => {
            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    items: { create: { productId: prod.id, quantity: 1, unitPrice: 100 } },
                },
            });

            const response = await request(app)
                .delete(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);
            const check = await prisma.purchaseOrder.findUnique({ where: { id: order.id } });
            expect(check).toBeNull();
        });

        it('should return 404 for non-existent order', async () => {
            const response = await request(app)
                .delete('/purchase-order/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('PUT /purchase-order/:id - Order already arrived', () => {
        it('should increase inventory when increasing quantity on arrived order', async () => {
            // Create order via API so inventory is properly managed
            const createResponse = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 1, unitPrice: 100 }],
                });
            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const invBefore = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invBefore?.quantity).toBe(11); // 10 + 1 from arrived

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 3, unitPrice: 100 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.data.updatedOrder.items[0].quantity).toBe(3);

            const invAfter = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invAfter?.quantity).toBe(13); // 10 + 3
        });

        it('should decrease inventory when decreasing quantity on arrived order', async () => {
            // Create order via API so inventory is properly managed
            const createResponse = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 5, unitPrice: 100 }],
                });
            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const invBefore = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invBefore?.quantity).toBe(15); // 10 + 5

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 2, unitPrice: 100 }],
                });

            expect(response.status).toBe(200);

            const invAfter = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invAfter?.quantity).toBe(12); // 10 + 2
        });

        it('should remove inventory when removing item from arrived order', async () => {
            const prodB = await prisma.product.create({
                data: {
                    name: 'ProdB',
                    category: 'C',
                    unitPrice: 50.0,
                    reorderLevel: 5,
                    inventories: { create: { shopId, quantity: 5 } },
                },
            });

            // Create order via API so inventory is properly managed
            const createResponse = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [
                        { productId: prod.id, quantity: 2, unitPrice: 100 },
                        { productId: prodB.id, quantity: 2, unitPrice: 50 },
                    ],
                });
            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 2, unitPrice: 100 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.data.updatedOrder.items).toHaveLength(1);

            const invB = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodB.id, shopId } },
            });
            expect(invB?.quantity).toBe(5); // original 5, no longer in order
        });

        it('should add inventory when adding new item to arrived order', async () => {
            const prodB = await prisma.product.create({
                data: {
                    name: 'ProdB',
                    category: 'C',
                    unitPrice: 50.0,
                    reorderLevel: 5,
                    inventories: { create: { shopId, quantity: 5 } },
                },
            });

            // Create order via API so inventory is properly managed
            const createResponse = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 2, unitPrice: 100 }],
                });
            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [
                        { productId: prod.id, quantity: 2, unitPrice: 100 },
                        { productId: prodB.id, quantity: 3, unitPrice: 50 },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body.data.updatedOrder.items).toHaveLength(2);

            const invB = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodB.id, shopId } },
            });
            expect(invB?.quantity).toBe(8); // 5 + 3
        });

        it('should handle changing shop and transfer inventory on arrived order', async () => {
            const shop2 = await prisma.shop.create({
                data: { name: 'Second Shop', address: '456 Second St' },
            });

            await prisma.inventory.create({
                data: { productId: prod.id, shopId: shop2.id, quantity: 20 },
            });

            // Create order via API so inventory is properly managed
            const createResponse = await request(app)
                .post('/purchase-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 3, unitPrice: 100 }],
                });
            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const invShop1Before = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invShop1Before?.quantity).toBe(13); // 10 + 3

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId: shop2.id,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 3, unitPrice: 100 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.data.updatedOrder.shopId).toBe(shop2.id);

            const invShop1After = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invShop1After?.quantity).toBe(10); // returned

            const invShop2After = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId: shop2.id } },
            });
            expect(invShop2After?.quantity).toBe(23); // 20 + 3 (new shop receives stock)
        });
    });

    describe('PUT /purchase-order/:id - Order not arrived', () => {
        it('should not change inventory when updating items on not-arrived order', async () => {
            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    arrived: false,
                    items: { create: { productId: prod.id, quantity: 2, unitPrice: 100 } },
                },
            });

            const invBefore = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invBefore?.quantity).toBe(10);

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: false,
                    items: [{ productId: prod.id, quantity: 5, unitPrice: 100 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.data.updatedOrder.items[0].quantity).toBe(5);

            const invAfter = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invAfter?.quantity).toBe(10); // unchanged
        });

        it('should add inventory immediately when marking arrived=true on not-arrived order', async () => {
            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    arrived: false,
                    items: { create: { productId: prod.id, quantity: 3, unitPrice: 100 } },
                },
            });

            const invBefore = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invBefore?.quantity).toBe(10);

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prod.id, quantity: 3, unitPrice: 100 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.data.updatedOrder.arrived).toBe(true);

            const invAfter = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invAfter?.quantity).toBe(13); // 10 + 3
        });

        it('should add inventory for new items when marking arrived=true', async () => {
            const prodB = await prisma.product.create({
                data: {
                    name: 'ProdB',
                    category: 'C',
                    unitPrice: 50.0,
                    reorderLevel: 5,
                    inventories: { create: { shopId, quantity: 5 } },
                },
            });

            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    arrived: false,
                    items: { create: { productId: prod.id, quantity: 2, unitPrice: 100 } },
                },
            });

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [
                        { productId: prod.id, quantity: 2, unitPrice: 100 },
                        { productId: prodB.id, quantity: 4, unitPrice: 50 },
                    ],
                });

            expect(response.status).toBe(200);

            const invA = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invA?.quantity).toBe(12); // 10 + 2

            const invB = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodB.id, shopId } },
            });
            expect(invB?.quantity).toBe(9); // 5 + 4
        });

        it('should return 404 when marking arrived=true and product has no inventory in shop', async () => {
            const otherShop = await prisma.shop.create({
                data: { name: 'Other Shop', address: '456 Other St' },
            });

            const prodNoInv = await prisma.product.create({
                data: {
                    name: 'NoInv',
                    category: 'C',
                    unitPrice: 50.0,
                    reorderLevel: 5,
                },
            });

            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 50,
                    arrived: false,
                    items: { create: { productId: prodNoInv.id, quantity: 2, unitPrice: 50 } },
                },
            });

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: true,
                    items: [{ productId: prodNoInv.id, quantity: 2, unitPrice: 50 }],
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('PUT /purchase-order/:id - Validation', () => {
        it('should return 403 if trying to update another admins order', async () => {
            const otherAdmin = await prisma.admin.create({
                data: { username: 'other', passwordHash: 'hash' },
            });
            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId: otherAdmin.id,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    arrived: false,
                    items: {
                        create: {
                            productId: prod.id,
                            quantity: 1,
                            unitPrice: 100,
                        },
                    },
                },
            });

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    orderDate: new Date().toISOString(),
                    arrived: false,
                    adminId: otherAdmin.id,
                    supplierId: supplier.id,
                    shopId,
                    items: [
                        {
                            productId: prod.id,
                            quantity: 1,
                            unitPrice: 100,
                        },
                    ],
                });

            expect(response.status).toBe(403);
            expect(response.body.error?.code).toBe('UNAUTHORIZED');
        });

        it('should return 404 if product not found in update', async () => {
            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    arrived: false,
                    items: { create: { productId: prod.id, quantity: 1, unitPrice: 100 } },
                },
            });

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: false,
                    items: [
                        { productId: '00000000-0000-0000-0000-000000000000', quantity: 1, unitPrice: 100 },
                    ],
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });

        it('should return 400 VALIDATION_FAILED if items array is empty', async () => {
            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    arrived: false,
                    items: { create: { productId: prod.id, quantity: 1, unitPrice: 100 } },
                },
            });

            const response = await request(app)
                .put(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    orderDate: new Date().toISOString(),
                    arrived: false,
                    items: [],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });
    });

    describe('PATCH /purchase-order/:id (orderArrived)', () => {
        it('should mark order as arrived and increment inventory', async () => {
            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    arrived: false,
                    items: { create: { productId: prod.id, quantity: 10, unitPrice: 100 } },
                },
            });

            const invBefore = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(invBefore?.quantity).toBe(10);

            const response = await request(app)
                .patch(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.arrived).toBe(true);

            const inv = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prod.id, shopId } },
            });
            expect(inv?.quantity).toBe(20);
        });

        it('should return 400 if order already arrived', async () => {
            const order = await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId,
                    totalAmount: 100,
                    arrived: true,
                    items: { create: { productId: prod.id, quantity: 5, unitPrice: 100 } },
                },
            });

            const response = await request(app)
                .patch(`/purchase-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('INVALID_STATE');
        });

        it('should return 404 for non-existent order', async () => {
            const response = await request(app)
                .patch('/purchase-order/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });
});
