import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { createTestAdmin, getAuthToken, resetDb } from '../helpers';

describe('Global Error Handling - Integration', () => {
    let authToken: string;

    beforeEach(async () => {
        await resetDb();
        const admin = await createTestAdmin();
        authToken = getAuthToken(admin.id, admin.username);
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

    it('should return 400 for invalid JSON payload', async () => {
        const response = await request(app)
            .post('/product/')
            .set('Authorization', `Bearer ${authToken}`)
            .set('Content-Type', 'application/json')
            .send('this is not json');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_FAILED');
        expect(response.body.error.message).toBe('Invalid JSON payload');
    });

    it('should return 400 for Zod validation failure', async () => {
        const response = await request(app)
            .post('/product/')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: '',
                category: '',
                unitPrice: -10,
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_FAILED');
    });
});
