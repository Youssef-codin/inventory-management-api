import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDb, createTestAdmin, getAuthToken } from '../helpers';
import { prisma } from '../../src/util/prisma';

describe('Product Module', () => {
    let authToken: string;

    beforeEach(async () => {
        await resetDb();
        const admin = await createTestAdmin();
        authToken = getAuthToken(admin.id, admin.username);
    });

    describe('GET /product', () => {
        it('should return 200 and list of products', async () => {
            await prisma.product.createMany({
                data: [
                    { name: 'P1', category: 'C1', unitPrice: 10.50, stockQuantity: 5 },
                    { name: 'P2', category: 'C2', unitPrice: 20.00, stockQuantity: 10 },
                ]
            });

            const response = await request(app)
                .get('/product')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

            it('should return 401 if not authenticated', async () => {

                const response = await request(app).get('/product');

                expect(response.body.error?.code).toBe('UNAUTHENTICATED');

                expect(response.status).toBe(401);

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

                        // stockQuantity default 0

                    });

        

                expect(response.status).toBe(201);

                expect(response.body.success).toBe(true);

                expect(response.body.data).toHaveProperty('id');

                expect(response.body.data.stockQuantity).toBe(0);

                // Check Decimal

                expect(response.body.data.unitPrice).toBe('99.99'); 

            });

        

            it('should return 400 for missing required fields', async () => {

                const response = await request(app)

                    .post('/product/add')

                    .set('Authorization', `Bearer ${authToken}`)

                    .send({

                        name: 'Missing Fields',

                        // missing category, unitPrice...

                    });

                expect(response.body.error?.code).toBe('VALIDATION_FAILED');

                expect(response.status).toBe(400);

            });

        

            it('should return 400 for negative values', async () => {

                // Assuming validation schema checks for positive/non-negative

                // Zod .min(0) or similar

                const response = await request(app)

                    .post('/product/add')

                    .set('Authorization', `Bearer ${authToken}`)

                    .send({

                        name: 'Negative Price',

                        category: 'Test',

                        unitPrice: -10,

                        reorderLevel: 5,

                    });

                

                expect(response.body.error?.code).toBe('VALIDATION_FAILED');

                expect(response.status).toBe(400);

            });

          });

        

          describe('GET /product/:id', () => {

            it('should return 200 for existing product', async () => {

                const product = await prisma.product.create({

                    data: { name: 'P', category: 'C', unitPrice: 10, stockQuantity: 5 }

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

                      data: { name: 'Old', category: 'C', unitPrice: 10, stockQuantity: 5, reorderLevel: 1 }

                  });

        

                  const response = await request(app)

                      .put(`/product/${product.id}`)

                      .set('Authorization', `Bearer ${authToken}`)

                      .send({

                          name: 'New',

                          category: 'C',

                          unitPrice: 15.50,

                          stockQuantity: 10,

                          reorderLevel: 2

                      });

        

                  expect(response.status).toBe(200);

                  expect(response.body.data.name).toBe('New');

                  expect(response.body.data.unitPrice).toBe('15.5');

                  expect(response.body.data.stockQuantity).toBe(10);

              });

        

              it('should return 400 for invalid payload', async () => {

                  const product = await prisma.product.create({ data: { name: 'P', category: 'C', unitPrice: 10 } });

                  const response = await request(app)

                    .put(`/product/${product.id}`)

                    .set('Authorization', `Bearer ${authToken}`)

                    .send({ unitPrice: "invalid" }); // String instead of number

                  expect(response.body.error?.code).toBe('VALIDATION_FAILED');

                  expect(response.status).toBe(400);

              });

          });

        

          describe('DELETE /product/:id', () => {

              it('should return 204 for existing product', async () => {

                  const product = await prisma.product.create({

                      data: { name: 'DeleteMe', category: 'C', unitPrice: 10 }

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
            // Create products
            await prisma.product.create({
                data: { name: 'Low Stock Product', category: 'Test', unitPrice: 10, stockQuantity: 2, reorderLevel: 5 }
            });
            await prisma.product.create({
                data: { name: 'In Stock Product', category: 'Test', unitPrice: 20, stockQuantity: 10, reorderLevel: 5 }
            });
            await prisma.product.create({
                data: { name: 'Another Low Stock', category: 'Test', unitPrice: 15, stockQuantity: 3, reorderLevel: 3 }
            });

            const response = await request(app)
                .get('/product/low-stock')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data.some((p: any) => p.name === 'Low Stock Product')).toBe(true);
            expect(response.body.data.some((p: any) => p.name === 'Another Low Stock')).toBe(true);
            expect(response.body.data.some((p: any) => p.name === 'In Stock Product')).toBe(false);
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app).get('/product/low-stock');
            expect(response.status).toBe(401);
            expect(response.body.error?.code).toBe('UNAUTHENTICATED');
        });
    });

    describe('PATCH /product/:id/stock', () => {
        it('should return 200 and update stockQuantity', async () => {
            const product = await prisma.product.create({
                data: { name: 'Stock Test Product', category: 'Test', unitPrice: 10, stockQuantity: 10, reorderLevel: 5 }
            });

            const response = await request(app)
                .patch(`/product/${product.id}/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 20 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.stockQuantity).toBe(20);

            const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
            expect(updatedProduct?.stockQuantity).toBe(20);
        });

        it('should return 404 for non-existent product', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .patch(`/product/${uuid}/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 15 });
            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });

        it('should return 400 for invalid product ID', async () => {
            const response = await request(app)
                .patch(`/product/invalid-uuid/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 15 });
            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED');
        });

        it('should return 400 for invalid amount (negative)', async () => {
            const product = await prisma.product.create({
                data: { name: 'Stock Negative Test', category: 'Test', unitPrice: 10, stockQuantity: 10, reorderLevel: 5 }
            });

            const response = await request(app)
                .patch(`/product/${product.id}/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: -5 });
            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED'); // Because schema has .min(0)
        });

        it('should return 400 for invalid amount (not integer)', async () => {
            const product = await prisma.product.create({
                data: { name: 'Stock Decimal Test', category: 'Test', unitPrice: 10, stockQuantity: 10, reorderLevel: 5 }
            });

            const response = await request(app)
                .patch(`/product/${product.id}/stock`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 10.5 });
            expect(response.status).toBe(400);
            expect(response.body.error?.code).toBe('VALIDATION_FAILED'); // Because schema has .int()
        });
    });
});
