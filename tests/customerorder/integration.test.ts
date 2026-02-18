import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { prisma } from '../../src/util/prisma';
import { createTestAdmin, getAuthToken, resetDb } from '../helpers';

describe('Customer Order Module - Integration', () => {
    let authToken: string;
    let adminId: string;
    let shopId: number;
    let prodA: any;
    let prodB: any;

    beforeEach(async () => {
        await resetDb();
        const admin = await createTestAdmin();
        adminId = admin.id;
        authToken = getAuthToken(admin.id, admin.username);

        const shop = await prisma.shop.create({
            data: { name: 'Test Shop', address: '123 Test St' },
        });
        shopId = shop.id;

        prodA = await prisma.product.create({
            data: { name: 'A', category: 'C', unitPrice: 50.0, reorderLevel: 3 },
        });
        prodB = await prisma.product.create({
            data: { name: 'B', category: 'C', unitPrice: 100.0, reorderLevel: 1 },
        });

        await prisma.inventory.create({
            data: { productId: prodA.id, shopId: shop.id, quantity: 10 },
        });
        await prisma.inventory.create({
            data: { productId: prodB.id, shopId: shop.id, quantity: 1 },
        });
    });

    describe('POST /customer-order/', () => {
        it('should create order (single item), decrement stock, calc total', async () => {
            const response = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 2, unitPrice: 50 }],
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            const orderData = response.body.data.order;
            expect(orderData).toHaveProperty('id');
            expect(orderData.items).toHaveLength(1);
            expect(orderData.shopId).toBe(shopId);
            expect(Number(orderData.totalAmount)).toBe(100.0);

            const invA = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invA?.quantity).toBe(8);
        });

        it('should create order (multiple items), decrement both, calc total', async () => {
            const response = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: prodA.id, quantity: 2, unitPrice: 50 },
                        { productId: prodB.id, quantity: 1, unitPrice: 100 },
                    ],
                });

            expect(response.status).toBe(201);
            const orderData = response.body.data.order;
            expect(Number(orderData.totalAmount)).toBe(200.0);

            const invA = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            const invB = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodB.id, shopId } },
            });

            expect(invA?.quantity).toBe(8);
            expect(invB?.quantity).toBe(0);
        });

        it('should fail with 400 INSUFFICIENT_STOCK if stock too low', async () => {
            const response = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 2, unitPrice: 50 }],
                });

            expect(response.body.error?.code).toBe('INSUFFICIENT_STOCK');
            expect(response.status).toBe(400);

            const invB = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodB.id, shopId } },
            });
            expect(invB?.quantity).toBe(1);
            const orderCount = await prisma.customerOrder.count();
            expect(orderCount).toBe(0);
        });

        it('should return 404 if product not found', async () => {
            const response = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: '00000000-0000-0000-0000-000000000000', quantity: 1, unitPrice: 50 },
                    ],
                });
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);

            const invA = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invA?.quantity).toBe(10);
        });

        it('should return 404 if shop not found', async () => {
            const response = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId: 99999,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1, unitPrice: 50 }],
                });
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);

            const orderCount = await prisma.customerOrder.count();
            expect(orderCount).toBe(0);
        });

        it('should include low stock warning', async () => {
            const response = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 8, unitPrice: 50 }],
                });

            expect(response.status).toBe(201);
            const lowStock = response.body.data.lowStockProducts;
            expect(lowStock).toBeDefined();
            const found = lowStock.find((p: any) => p.productId === prodA.id);
            expect(found).toBeDefined();
        });
    });

    describe('PUT /customer-order/:id', () => {
        it('should return 403 UNAUTHORIZED if adminId mismatch', async () => {
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const otherAdminId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId: otherAdminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1, unitPrice: 50 }],
                });

            expect(response.body.error?.code).toBe('UNAUTHORIZED');
            expect(response.status).toBe(403);
        });

        it('should return 400 VALIDATION_FAILED if items array is empty', async () => {
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });

        it('should update order (replaces items)', async () => {
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;
            const originalItemId = order.items[0].id;

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 2, unitPrice: 50 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            const updated = response.body.data.updatedOrder;
            expect(Number(updated.totalAmount)).toBe(100.0);
            expect(updated.items[0].quantity).toBe(2);

            const oldItem = await prisma.customerOrderItem.findUnique({
                where: { id: originalItemId },
            });
            expect(oldItem).toBeNull();
            expect(updated.items[0].id).not.toBe(originalItemId);
        });

        it('should handle non-existent productId', async () => {
            const order = await prisma.customerOrder.create({
                data: {
                    adminId,
                    shopId,
                    totalAmount: 50,
                    items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } },
                },
            });

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: '00000000-0000-0000-0000-000000000000', quantity: 1, unitPrice: 50 },
                    ],
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });

        it('should handle insufficient stock when increasing quantity', async () => {
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 1, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 2, unitPrice: 50 }],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('INSUFFICIENT_STOCK');
        });

        it('should handle multiple items with mixed valid/invalid', async () => {
            const order = await prisma.customerOrder.create({
                data: {
                    adminId,
                    shopId,
                    totalAmount: 50,
                    items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } },
                },
            });

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: prodA.id, quantity: 1, unitPrice: 50 },
                        { productId: '00000000-0000-0000-0000-000000000000', quantity: 1, unitPrice: 50 },
                    ],
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });

        it('should fail with INSUFFICIENT_STOCK when quantity exceeds available stock', async () => {
            const order = await prisma.customerOrder.create({
                data: {
                    adminId,
                    shopId,
                    totalAmount: 50,
                    items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } },
                },
            });

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 999999, unitPrice: 50 }],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('INSUFFICIENT_STOCK');
        });

        it('should handle changing to different product', async () => {
            const order = await prisma.customerOrder.create({
                data: {
                    adminId,
                    shopId,
                    totalAmount: 50,
                    items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } },
                },
            });

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 1, unitPrice: 50 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedOrder.items[0].productId).toBe(prodB.id);
            expect(Number(response.body.data.updatedOrder.totalAmount)).toBe(100);
        });

        it('should handle adding multiple new items', async () => {
            const order = await prisma.customerOrder.create({
                data: {
                    adminId,
                    shopId,
                    totalAmount: 50,
                    items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } },
                },
            });

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: prodA.id, quantity: 1, unitPrice: 50 },
                        { productId: prodB.id, quantity: 1, unitPrice: 100 },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedOrder.items).toHaveLength(2);
            expect(Number(response.body.data.updatedOrder.totalAmount)).toBe(150);
        });

        it('should handle removing all items and adding different ones', async () => {
            const order = await prisma.customerOrder.create({
                data: {
                    adminId,
                    shopId,
                    totalAmount: 50,
                    items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } },
                },
            });

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 1, unitPrice: 50 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedOrder.items).toHaveLength(1);
            expect(response.body.data.updatedOrder.items[0].productId).toBe(prodB.id);
        });

        it('should handle quantity at exact stock level', async () => {
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 10, unitPrice: 50 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Number(response.body.data.updatedOrder.totalAmount)).toBe(500);
        });
    });

    describe('Shop Change', () => {
        it('should change shop and transfer inventory correctly', async () => {
            // Create a second shop with inventory
            const shop2 = await prisma.shop.create({
                data: { name: 'Second Shop', address: '456 Second St' },
            });

            await prisma.inventory.create({
                data: { productId: prodA.id, shopId: shop2.id, quantity: 20 },
            });

            // Create order in first shop
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 5, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            // Verify original shop inventory decreased
            const invShop1Before = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invShop1Before?.quantity).toBe(5); // 10 - 5

            // Update order to different shop
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId: shop2.id, // Change to shop 2
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 5, unitPrice: 50 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedOrder.shopId).toBe(shop2.id);

            // Verify inventory transfers:
            // Shop 1: should get back the 5 units
            const invShop1After = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invShop1After?.quantity).toBe(10); // 5 + 5 returned

            // Shop 2: should have 5 less (20 - 5 = 15)
            const invShop2After = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId: shop2.id } },
            });
            expect(invShop2After?.quantity).toBe(15);
        });

        it('should reject shop change when new shop lacks inventory', async () => {
            // Create a second shop with limited inventory
            const shop2 = await prisma.shop.create({
                data: { name: 'Second Shop', address: '456 Second St' },
            });

            await prisma.inventory.create({
                data: { productId: prodA.id, shopId: shop2.id, quantity: 2 },
            });

            // Create order in first shop with quantity 5
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 5, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            // Try to change to shop 2 which only has 2 units
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId: shop2.id,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 5, unitPrice: 50 }],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('INSUFFICIENT_STOCK');
        });

        it('should handle shop change with different products', async () => {
            // Create a second shop with different inventory
            const shop2 = await prisma.shop.create({
                data: { name: 'Second Shop', address: '456 Second St' },
            });

            await prisma.inventory.create({
                data: { productId: prodA.id, shopId: shop2.id, quantity: 10 },
            });
            await prisma.inventory.create({
                data: { productId: prodB.id, shopId: shop2.id, quantity: 5 },
            });

            // Create order in first shop with prodA
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 3, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            // Change shop and also change product
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId: shop2.id,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 3, unitPrice: 50 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedOrder.shopId).toBe(shop2.id);
            expect(response.body.data.updatedOrder.items[0].productId).toBe(prodB.id);

            // Verify original shop got inventory back
            const invShop1 = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invShop1?.quantity).toBe(10); // 7 + 3 returned

            // Verify new shop inventory decreased
            const invShop2ProdB = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodB.id, shopId: shop2.id } },
            });
            expect(invShop2ProdB?.quantity).toBe(2); // 5 - 3
        });

        it('should reject shop change to non-existent shop', async () => {
            // Create order
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 2, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            // Try to change to non-existent shop
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId: 99999, // Non-existent shop
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 2, unitPrice: 50 }],
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('GET /customer-order/:id', () => {
        it('should return order by ID', async () => {
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 2, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const orderId = createResponse.body.data.order.id;

            const response = await request(app)
                .get(`/customer-order/${orderId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(orderId);
            expect(response.body.data.items).toHaveLength(1);
            expect(Number(response.body.data.totalAmount)).toBe(100);
        });
    });

    describe('DELETE /customer-order/:id', () => {
        it('should return 204 and delete order with its items', async () => {
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;
            const itemId = order.items[0].id;

            const response = await request(app)
                .delete(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);
            const checkOrder = await prisma.customerOrder.findUnique({ where: { id: order.id } });
            expect(checkOrder).toBeNull();

            const checkItem = await prisma.customerOrderItem.findUnique({ where: { id: itemId } });
            expect(checkItem).toBeNull();
        });

        it('should restore inventory when deleting order', async () => {
            const createResponse = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 5, unitPrice: 50 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            const invBefore = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invBefore?.quantity).toBe(5);

            const response = await request(app)
                .delete(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);

            const invAfter = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invAfter?.quantity).toBe(10);
        });
    });

    describe('Edge Cases', () => {
        it('should return 404 when product has no inventory record for shop', async () => {
            const prodNoInventory = await prisma.product.create({
                data: { name: 'No Inventory', category: 'Test', unitPrice: 50, reorderLevel: 5 },
            });

            const response = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodNoInventory.id, quantity: 1, unitPrice: 50 }],
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });

        it('should handle order with future date', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            const response = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: futureDate.toISOString(),
                    items: [{ productId: prodA.id, quantity: 1, unitPrice: 50 }],
                });

            expect([201, 400]).toContain(response.status);
        });

        it('should handle order with past date', async () => {
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);

            const response = await request(app)
                .post('/customer-order/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: pastDate.toISOString(),
                    items: [{ productId: prodA.id, quantity: 1, unitPrice: 50 }],
                });

            expect([201, 400]).toContain(response.status);
        });
    });
});
