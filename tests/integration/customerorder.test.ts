import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDb, createTestAdmin, getAuthToken } from '../helpers';
import { prisma } from '../../src/util/prisma';

describe('Customer Order Module', () => {
    let authToken: string;
    let adminId: string;
    let prodA: any;
    let prodB: any;

    beforeEach(async () => {
        await resetDb();
        const admin = await createTestAdmin();
        adminId = admin.id;
        authToken = getAuthToken(admin.id, admin.username);

        // Seed products
        prodA = await prisma.product.create({
            data: { name: 'A', category: 'C', unitPrice: 50.00, stockQuantity: 10, reorderLevel: 3 }
        });
        prodB = await prisma.product.create({
            data: { name: 'B', category: 'C', unitPrice: 100.00, stockQuantity: 1, reorderLevel: 1 }
        });
    });

    describe('POST /customer-order/add', () => {
        it('should create order (single item), decrement stock, calc total', async () => {
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    orderDate: new Date().toISOString(),
                    items: [{
                        productId: prodA.id,
                        quantity: 2
                    }]
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            const orderData = response.body.data.order; // Nested structure
            expect(orderData).toHaveProperty('id');
            expect(orderData.items).toHaveLength(1);

            // Total = 2 * 50 = 100
            expect(Number(orderData.totalAmount)).toBe(100.00);

            // Verify stock
            const updatedProdA = await prisma.product.findUnique({ where: { id: prodA.id } });
            expect(updatedProdA?.stockQuantity).toBe(8); // 10 - 2
        });

        it('should create order (multiple items), decrement both, calc total', async () => {
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    orderDate: new Date().toISOString(),
                    items: [
                        { productId: prodA.id, quantity: 2 }, // 2 * 50 = 100
                        { productId: prodB.id, quantity: 1 }  // 1 * 100 = 100
                    ]
                });

            expect(response.status).toBe(201);
            const orderData = response.body.data.order;
            expect(Number(orderData.totalAmount)).toBe(200.00);

            const upA = await prisma.product.findUnique({ where: { id: prodA.id } });
            const upB = await prisma.product.findUnique({ where: { id: prodB.id } });

            expect(upA?.stockQuantity).toBe(8);
            expect(upB?.stockQuantity).toBe(0);
        });

        it('should fail with 400 INSUFFICIENT_STOCK if stock too low', async () => {
            // Order 2 of B (stock is 1)
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodB.id, quantity: 2 }]
                });

            expect(response.body.error?.code).toBe('INSUFFICIENT_STOCK');
            expect(response.status).toBe(400);

            // Verify no changes
            const checkB = await prisma.product.findUnique({ where: { id: prodB.id } });
            expect(checkB?.stockQuantity).toBe(1);
            const orderCount = await prisma.customerOrder.count();
            expect(orderCount).toBe(0);
        });

        it('should return 404 if product not found', async () => {
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 1 }]
                });
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);

            // No stock change
            const checkA = await prisma.product.findUnique({ where: { id: prodA.id } });
            expect(checkA?.stockQuantity).toBe(10);
        });

        it('should return 400 for invalid item payload', async () => {
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: -5 }] // Negative
                });
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
            expect(response.status).toBe(400);

            const response2 = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    orderDate: new Date().toISOString(),
                    items: [] // Empty
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
                    orderDate: new Date().toISOString(),
                    items: [{
                        productId: prodA.id, quantity: 8
                    }]
                });

            expect(response.status).toBe(201);
            // Expect lowStockProductIds to contain prodA
            const lowStock = response.body.data.lowStockProductIds;
            expect(lowStock).toBeDefined();
            const found = lowStock.find((p: any) => p.id === prodA.id);
            expect(found).toBeDefined();
        });

        it('should return 403 UNAUTHORIZED if adminId mismatch', async () => {
            const otherAdminId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .post('/customer-order/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId: otherAdminId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }]
                });
            expect(response.body.error?.code).toBe('UNAUTHORIZED');
            expect(response.status).toBe(403);
        });
    });

    describe('PUT /customer-order/:id', () => {
        it('should update order', async () => {
            // Create initial order
            const order = await prisma.customerOrder.create({
                data: {
                    adminId,
                    totalAmount: 50,
                    items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } }
                },
                include: { items: true }
            });

            // Update quantity
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId, // Must match requester
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 2 }]
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            const updated = response.body.data;
            expect(Number(updated.totalAmount)).toBe(100.00); // 2 * 50
            expect(updated.items[0].quantity).toBe(2);
        });

        it('should return 404 if order not found', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .put(`/customer-order/${uuid}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId,
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }]
                });
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);
        });

        it('should return 403 if adminId mismatch', async () => {
            const order = await prisma.customerOrder.create({
                data: { adminId, totalAmount: 50, items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } } }
            });
            const response = await request(app)
                .put(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    adminId: '00000000-0000-0000-0000-000000000000',
                    orderDate: new Date().toISOString(),
                    items: [{ productId: prodA.id, quantity: 1 }]
                });
            expect(response.body.error?.code).toBe('UNAUTHORIZED');
            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /customer-order/:id', () => {
        it('should return 204', async () => {
            const order = await prisma.customerOrder.create({
                data: {
                    adminId,
                    totalAmount: 50,
                    items: { create: { productId: prodA.id, quantity: 1, unitPrice: 50 } }
                }
            });

            const response = await request(app)
                .delete(`/customer-order/${order.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);
            const check = await prisma.customerOrder.findUnique({ where: { id: order.id } });
            expect(check).toBeNull();
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
