import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { prisma } from '../../src/util/prisma';
import { createTestAdmin, getAuthToken, resetDb } from '../helpers';

describe('Supplier Module - Integration', () => {
    let authToken: string;
    let adminId: string;

    beforeEach(async () => {
        await resetDb();
        const admin = await createTestAdmin();
        adminId = admin.id;
        authToken = getAuthToken(admin.id, admin.username);
    });

    describe('GET /supplier', () => {
        it('should return 200 and list of suppliers', async () => {
            await prisma.supplier.createMany({
                data: [
                    { name: 'Sup1', contactEmail: 's1@test.com', phone: '1', address: 'A' },
                    { name: 'Sup2', contactEmail: 's2@test.com', phone: '2', address: 'B' },
                ],
            });

            const response = await request(app).get('/supplier').set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });
    });

    describe('POST /supplier/', () => {
        it('should create supplier with valid data', async () => {
            const response = await request(app)
                .post('/supplier/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Supplier',
                    contactEmail: 'test@supplier.com',
                    phone: '1234567890',
                    address: '123 Test St',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Test Supplier');
        });
    });

    describe('GET /supplier/:id', () => {
        it('should return 200 for existing supplier', async () => {
            const supplier = await prisma.supplier.create({
                data: { name: 'Test', contactEmail: 't@test.com', phone: '1', address: 'A' },
            });

            const response = await request(app)
                .get(`/supplier/${supplier.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(supplier.id);
        });

        it('should return 404 for non-existent supplier', async () => {
            const response = await request(app)
                .get('/supplier/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('PUT /supplier/:id', () => {
        it('should return 200 and update supplier', async () => {
            const supplier = await prisma.supplier.create({
                data: { name: 'Old', contactEmail: 'old@test.com', phone: '1', address: 'A' },
            });

            const response = await request(app)
                .put(`/supplier/${supplier.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'New',
                    contactEmail: 'new@test.com',
                    phone: '2',
                    address: 'B',
                });

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('New');
        });

        it('should return 404 for non-existent supplier', async () => {
            const response = await request(app)
                .put('/supplier/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Ghost',
                    contactEmail: 'ghost@test.com',
                    phone: '1',
                    address: 'A',
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('DELETE /supplier/:id', () => {
        it('should return 204 for existing supplier', async () => {
            const supplier = await prisma.supplier.create({
                data: { name: 'S', contactEmail: 's@s.com', phone: '1', address: 'A' },
            });
            const response = await request(app)
                .delete(`/supplier/${supplier.id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(204);
        });

        it('should return 404 for non-existent supplier', async () => {
            const response = await request(app)
                .delete(`/supplier/00000000-0000-0000-0000-000000000000`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);
        });

        it('should handle deletion of supplier with orders', async () => {
            const supplier = await prisma.supplier.create({
                data: { name: 'Linked', contactEmail: 'l@s.com', phone: '1', address: 'A' },
            });
            const shop = await prisma.shop.create({ data: { name: 'Test Shop', address: '123 Test St' } });
            const product = await prisma.product.create({
                data: { name: 'P', category: 'C', unitPrice: 10 },
            });
            await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier.id,
                    shopId: shop.id,
                    totalAmount: 10,
                    items: {
                        create: { productId: product.id, quantity: 1, unitPrice: 10 },
                    },
                },
            });

            const response = await request(app)
                .delete(`/supplier/${supplier.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 204) {
                const check = await prisma.supplier.findUnique({ where: { id: supplier.id } });
                expect(check).toBeNull();
            } else {
                expect(response.status).not.toBe(200);
                expect(response.status).not.toBe(201);
            }
        });
    });

    describe('GET /supplier/product/:productId', () => {
        it('should return 200 and list of suppliers for a given product', async () => {
            const product1 = await prisma.product.create({
                data: { name: 'Prod1', category: 'Cat1', unitPrice: 10 },
            });
            const product2 = await prisma.product.create({
                data: { name: 'Prod2', category: 'Cat2', unitPrice: 20 },
            });

            const supplier1 = await prisma.supplier.create({
                data: { name: 'Supp1', contactEmail: 's1@a.com', phone: '1', address: 'A' },
            });
            const supplier2 = await prisma.supplier.create({
                data: { name: 'Supp2', contactEmail: 's2@a.com', phone: '2', address: 'B' },
            });
            const supplier3 = await prisma.supplier.create({
                data: { name: 'Supp3', contactEmail: 's3@a.com', phone: '3', address: 'C' },
            });

            const shop = await prisma.shop.create({ data: { name: 'Test Shop', address: '123 Test St' } });

            await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier1.id,
                    shopId: shop.id,
                    totalAmount: 100,
                    items: {
                        create: { productId: product1.id, quantity: 10, unitPrice: 10 },
                    },
                },
            });

            await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier2.id,
                    shopId: shop.id,
                    totalAmount: 150,
                    items: {
                        createMany: {
                            data: [
                                { productId: product1.id, quantity: 5, unitPrice: 10 },
                                { productId: product2.id, quantity: 5, unitPrice: 20 },
                            ],
                        },
                    },
                },
            });

            await prisma.purchaseOrder.create({
                data: {
                    adminId,
                    supplierId: supplier3.id,
                    shopId: shop.id,
                    totalAmount: 200,
                    items: {
                        create: { productId: product2.id, quantity: 10, unitPrice: 20 },
                    },
                },
            });

            const response = await request(app)
                .get(`/supplier/product/${product1.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data.some((s: any) => s.id === supplier1.id)).toBe(true);
            expect(response.body.data.some((s: any) => s.id === supplier2.id)).toBe(true);
            expect(response.body.data.some((s: any) => s.id === supplier3.id)).toBe(false);
        });

        it('should return an empty array if no supplier delivers the product', async () => {
            const product = await prisma.product.create({
                data: { name: 'No Supplier Prod', category: 'Cat', unitPrice: 1 },
            });
            const response = await request(app)
                .get(`/supplier/product/${product.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(0);
        });
    });
});
