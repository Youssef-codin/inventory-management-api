import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { prisma } from '../../src/util/prisma';
import { createTestAdmin, getAuthToken, resetDb } from '../helpers';

describe('Shop Module - Integration', () => {
    let authToken: string;

    beforeEach(async () => {
        await resetDb();
        const admin = await createTestAdmin();
        authToken = getAuthToken(admin.id, admin.username);
    });

    describe('GET /shop', () => {
        it('should return 200 and list of shops', async () => {
            await prisma.shop.createMany({
                data: [
                    { name: 'Shop 1', address: 'Addr 1' },
                    { name: 'Shop 2', address: 'Addr 2' },
                ],
            });

            const response = await request(app).get('/shop').set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data.some((s: any) => s.name === 'Shop 1')).toBe(true);
            expect(response.body.data.some((s: any) => s.name === 'Shop 2')).toBe(true);
        });
    });

    describe('POST /shop/', () => {
        it('should create shop with valid data', async () => {
            const response = await request(app)
                .post('/shop/')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'New Shop',
                    address: 'New Address',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe('New Shop');
            expect(response.body.data.address).toBe('New Address');
        });
    });

    describe('GET /shop/:id', () => {
        it('should return 200 for existing shop', async () => {
            const shop = await prisma.shop.create({
                data: { name: 'Test Shop', address: 'Address' },
            });

            const response = await request(app)
                .get(`/shop/${shop.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(shop.id);
            expect(response.body.data.name).toBe('Test Shop');
        });

        it('should return 404 for non-existent shop', async () => {
            const response = await request(app)
                .get(`/shop/99999`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('PUT /shop/:id', () => {
        it('should return 200 and update fields', async () => {
            const shop = await prisma.shop.create({
                data: { name: 'Old Name', address: 'Old Address' },
            });

            const response = await request(app)
                .put(`/shop/${shop.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'New Name',
                    address: 'New Address',
                });

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('New Name');
            expect(response.body.data.address).toBe('New Address');
        });

        it('should return 404 for non-existent shop', async () => {
            const response = await request(app)
                .put(`/shop/99999`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Update',
                    address: 'Addr',
                });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('DELETE /shop/:id', () => {
        it('should return 204 for existing shop', async () => {
            const shop = await prisma.shop.create({
                data: { name: 'Delete Me', address: 'Address' },
            });

            const response = await request(app)
                .delete(`/shop/${shop.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);

            const check = await prisma.shop.findUnique({ where: { id: shop.id } });
            expect(check).toBeNull();
        });

        it('should return 404 for non-existent shop', async () => {
            const response = await request(app)
                .delete(`/shop/99999`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });
});
