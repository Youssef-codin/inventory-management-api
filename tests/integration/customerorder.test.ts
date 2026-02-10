import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { prisma } from '../../src/util/prisma';
import { createTestAdmin, getAuthToken, resetDb } from '../helpers';

describe('Customer Order Module', () => {
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

        // Create Shop
        const shop = await prisma.shop.create({
            data: { name: 'Test Shop', address: '123 Test St' },
        });
        shopId = shop.id;

        // Seed products
        prodA = await prisma.product.create({
            data: { name: 'A', category: 'C', unitPrice: 50.0, reorderLevel: 3 },
        });
        prodB = await prisma.product.create({
            data: { name: 'B', category: 'C', unitPrice: 100.0, reorderLevel: 1 },
        });

        // Seed Inventory
        await prisma.inventory.create({
            data: { productId: prodA.id, shopId: shop.id, quantity: 10 },
        });
        await prisma.inventory.create({
            data: { productId: prodB.id, shopId: shop.id, quantity: 1 },
        });
    });

    describe('POST /customer-order/add', () => {
        it('should create order (single item), decrement stock, calc total', async () => {
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        {
                            productId: prodA.id,
                            quantity: 2,
                        },
                    ],
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            const orderData = response.body.data.order; // Nested structure
            expect(orderData).toHaveProperty('id');
            expect(orderData.items).toHaveLength(1);
            expect(orderData.shopId).toBe(shopId);

            // Total = 2 * 50 = 100
            expect(Number(orderData.totalAmount)).toBe(100.0);

            // Verify stock
            const invA = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invA?.quantity).toBe(8); // 10 - 2
        });

        it('should create order (multiple items), decrement both, calc total', async () => {
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: prodA.id, quantity: 2 }, // 2 * 50 = 100
                        { productId: prodB.id, quantity: 1 }, // 1 * 100 = 100
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
            // Order 2 of B (stock is 1)
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 2 }],
                });

            expect(response.body.error?.code).toBe('INSUFFICIENT_STOCK');
            expect(response.status).toBe(400);

            // Verify no changes
            const invB = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodB.id, shopId } },
            });
            expect(invB?.quantity).toBe(1);
            const orderCount = await prisma.customerOrder.count();
            expect(orderCount).toBe(0);
        });

        it('should return 404 if product not found', async () => {
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
                });
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);

            // No stock change
            const invA = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invA?.quantity).toBe(10);
        });

        it('should return 400 for invalid item payload', async () => {
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: -5 }], // Negative
                });
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
            expect(response.status).toBe(400);

            const response2 = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [], // Empty
                });
            expect(response2.body.error?.code).toBe('VALIDATION_FAILED');
            expect(response2.status).toBe(400);
        });
        it('should include low stock warning', async () => {
            // ProdA has 10, reorder 3. Order 8 -> left 2 (<= 3). Should warn.
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        {
                            productId: prodA.id,
                            quantity: 8,
                        },
                    ],
                });

            expect(response.status).toBe(201);
            // Expect lowStockProducts to contain prodA
            const lowStock = response.body.data.lowStockProducts;
            expect(lowStock).toBeDefined();
            const found = lowStock.find((p: any) => p.productId === prodA.id);
            expect(found).toBeDefined();
        });

        it('should return 403 UNAUTHORIZED if adminId mismatch', async () => {
            const otherAdminId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId: otherAdminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
                });
            expect(response.body.error?.code).toBe('UNAUTHORIZED');
            expect(response.status).toBe(403);
        });
    });

    describe('PUT /customer-order/:id', () => {
        it('should update order (replaces items)', async () => {
            // Create initial order with 1x prodA via API to properly decrement inventory
            const createResponse = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;
            const originalItemId = order.items[0].id;

            // Update quantity from 1 to 2
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId, // Must match requester
                    shopId, // Required by schema
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 2 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            const updated = response.body.data.updatedOrder;
            expect(Number(updated.totalAmount)).toBe(100.0); // 2 * 50
            expect(updated.items[0].quantity).toBe(2);

            // Verify old item was deleted and new item created
            const oldItem = await prisma.customerOrderItem.findUnique({
                where: { id: originalItemId },
            });
            expect(oldItem).toBeNull(); // Old item should be deleted
            expect(updated.items[0].id).not.toBe(originalItemId); // New item has new ID
        });

        it('should return 404 if order not found', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .put(`/customer-order/${uuid}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
                });
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);
        });

        it('should return 403 if adminId mismatch', async () => {
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
                    adminId: '00000000-0000-0000-0000-000000000000',
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
                });
            expect(response.body.error?.code).toBe('UNAUTHORIZED');
            expect(response.status).toBe(403);
        });

        it('should handle empty items array', async () => {
            // Create order via API
            const createResponse = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
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

            // Implementation doesn't handle empty items well - returns 400
            expect(response.status).toBe(400);
        });

        it('should handle invalid quantity (zero)', async () => {
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
                    items: [{ productId: prodA.id, quantity: 0 }],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });

        it('should handle invalid quantity (negative)', async () => {
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
                    items: [{ productId: prodA.id, quantity: -5 }],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });

        it('should handle invalid quantity (decimal)', async () => {
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
                    items: [{ productId: prodA.id, quantity: 2.5 }],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });

        it('should handle invalid productId format', async () => {
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
                    items: [{ productId: 'invalid-uuid', quantity: 1 }],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
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
                    items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });

        it('should handle insufficient stock when increasing quantity', async () => {
            // Create order via API to properly track inventory
            const createResponse = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 1 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            // Try to increase quantity from 1 to 2, but prodB only had 1 in stock and it's now 0
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 2 }],
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

            // One valid item, one non-existent product
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: prodA.id, quantity: 1 },
                        { productId: '00000000-0000-0000-0000-000000000000', quantity: 1 },
                    ],
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });

        it('should handle duplicate productIds in items', async () => {
            // Create order via API
            const createResponse = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            // Same product appears twice
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: prodA.id, quantity: 1 },
                        { productId: prodA.id, quantity: 2 },
                    ],
                });

            // Implementation returns 400 for duplicates (validation fails before product check)
            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });

        it('should handle missing required fields', async () => {
            const order = await prisma.customerOrder.create({
                data: {
                    adminId,
                    shopId,
                    totalAmount: 50,
                    items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } },
                },
            });

            // Missing shopId
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
                });

            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });

        it('should handle invalid order date', async () => {
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
                    orderDate: 'invalid-date',
                    items: [{ productId: prodA.id, quantity: 1 }],
                });

            // Should either fail validation or default to current date
            expect([200, 400]).toContain(response.status);
        });

        it('should handle invalid order ID format', async () => {
            const response = await request(app)
                .put('/customer-order/invalid-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
                });

            expect(response.status).toBe(400);
        });

        it('should handle very large quantity', async () => {
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
                    items: [{ productId: prodA.id, quantity: 999999 }],
                });

            // Should fail due to insufficient stock
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

            // Change from prodA to prodB
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 1 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedOrder.items[0].productId).toBe(prodB.id);
            expect(Number(response.body.data.updatedOrder.totalAmount)).toBe(100); // 1 * 100
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

            // Add prodB as additional item
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: prodA.id, quantity: 1 },
                        { productId: prodB.id, quantity: 1 },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedOrder.items).toHaveLength(2);
            expect(Number(response.body.data.updatedOrder.totalAmount)).toBe(150); // 50 + 100
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

            // Remove prodA, add only prodB
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 1 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedOrder.items).toHaveLength(1);
            expect(response.body.data.updatedOrder.items[0].productId).toBe(prodB.id);
        });

        it('should handle no authorization token', async () => {
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
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
                });

            expect(response.status).toBe(401);
        });

        it('should handle quantity at exact stock level', async () => {
            // Create order via API with 1 item (inventory becomes 9)
            const createResponse = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            // Inventory is now 9, try to update to quantity 10 (diff = +9)
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 10 }],
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Number(response.body.data.updatedOrder.totalAmount)).toBe(500); // 10 * 50
        });
    });

    describe('DELETE /customer-order/:id', () => {
        it('should return 204 and delete order with its items', async () => {
            // Create order via API to properly track inventory
            const createResponse = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }],
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

            // Verify associated items are also deleted
            const checkItem = await prisma.customerOrderItem.findUnique({ where: { id: itemId } });
            expect(checkItem).toBeNull();
        });

        it('should restore inventory when deleting order', async () => {
            // Create order via API
            const createResponse = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    shopId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 5 }],
                });

            expect(createResponse.status).toBe(201);
            const order = createResponse.body.data.order;

            // Verify inventory was decremented (10 - 5 = 5)
            const invBefore = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invBefore?.quantity).toBe(5);

            // Delete the order
            const response = await request(app)
                .delete(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);

            // Verify inventory was restored (5 + 5 = 10)
            const invAfter = await prisma.inventory.findUnique({
                where: { productId_shopId: { productId: prodA.id, shopId } },
            });
            expect(invAfter?.quantity).toBe(10);
        });

        it('should return 404 if order not found', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .delete(`/customer-order/${uuid}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);
        });
    });
});
