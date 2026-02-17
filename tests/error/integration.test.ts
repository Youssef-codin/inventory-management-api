import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { createTestAdmin, getAuthToken, resetDb } from '../helpers';

describe('Global Error Handling - Integration', () => {
    let authToken: string;
    let adminId: string;

    beforeEach(async () => {
        await resetDb();
        const admin = await createTestAdmin();
        authToken = getAuthToken(admin.id, admin.username);
        adminId = admin.id;
    });

    it('should return 404 JSON for unknown routes', async () => {
        const response = await request(app)
            .get('/api/does-not-exist')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.type).toBe('application/json');
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 401 if Authorization header is missing', async () => {
        const response = await request(app).get('/product');
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('should return 401 for an invalid JWT', async () => {
        const invalidToken = 'invalid.jwt.token';
        const response = await request(app).get('/product').set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHENTICATED');
        expect(response.body.error.message).toBe('Invalid token');
    });

    it('should return 401 for an expired JWT', async () => {
        const expiredToken = jwt.sign({ id: adminId, username: 'test_admin' }, process.env.JWT_SECRET!, {
            expiresIn: '0s',
        });

        await new Promise((resolve) => setTimeout(resolve, 100));

        const response = await request(app).get('/product').set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHENTICATED');
        expect(response.body.error.message).toBe('Token expired');
    });

    it('should return 400 for invalid JSON payload', async () => {
        const response = await request(app)
            .post('/product/add')
            .set('Authorization', `Bearer ${authToken}`)
            .set('Content-Type', 'application/json')
            .send('this is not json');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_FAILED');
        expect(response.body.error.message).toBe('Invalid JSON payload');
    });

    it('should accept decimal inputs and store correctly', async () => {
        const response = await request(app)
            .post('/product/')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Decimal Test',
                category: 'Test',
                unitPrice: 100.53,
                reorderLevel: 5,
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.unitPrice).toBe('100.53');
    });
});
