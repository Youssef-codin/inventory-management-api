import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { hashPassword } from '../../src/util/auth';
import { prisma } from '../../src/util/prisma';
import { createTestAdmin, getAuthToken, resetDb } from '../helpers';

describe('Auth Module - Integration', () => {
    beforeEach(async () => {
        await resetDb();
    });

    describe('POST /auth/login', () => {
        it('should login successfully with valid credentials and return JWT', async () => {
            const password = 'password123';
            const passwordHash = await hashPassword(password);

            const admin = await prisma.admin.create({
                data: {
                    username: 'admin',
                    passwordHash,
                },
            });

            const response = await request(app).post('/auth/login').send({
                username: 'admin',
                password: 'password123',
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(typeof response.body.data).toBe('string');
            expect(response.body).not.toHaveProperty('passwordHash');
        });

        it('should fail with 401 for invalid password', async () => {
            await prisma.admin.create({
                data: {
                    username: 'admin',
                    passwordHash: await hashPassword('correct'),
                },
            });

            const response = await request(app).post('/auth/login').send({
                username: 'admin',
                password: 'wrong',
            });

            expect(response.body.success).toBe(false);
            expect(response.body.error?.code).toBe('INVALID_CREDENTIALS');
            expect(response.status).toBe(401);
        });

        it('should fail with 401 for invalid username', async () => {
            const response = await request(app).post('/auth/login').send({
                username: 'nonexistent',
                password: 'password123',
            });

            expect(response.body.success).toBe(false);
            expect(response.body.error?.code).toBe('INVALID_CREDENTIALS');
            expect(response.status).toBe(401);
        });
    });

    describe('Auth Middleware (Global)', () => {
        let authToken: string;
        let adminId: string;

        beforeEach(async () => {
            const admin = await createTestAdmin();
            adminId = admin.id;
            authToken = getAuthToken(admin.id, admin.username);
        });

        it('should return 401 when requesting protected route without Authorization', async () => {
            const response = await request(app).get('/product');
            expect(response.body.success).toBe(false);
            expect(response.body.error?.code).toBe('UNAUTHENTICATED');
            expect(response.status).toBe(401);
        });

        it('should return 401 when Authorization header has wrong scheme', async () => {
            const response = await request(app).get('/product').set('Authorization', 'Basic 123456');

            expect(response.body.error?.code).toBe('UNAUTHENTICATED');
            expect(response.status).toBe(401);
        });

        it('should return 401 when token is invalid signature', async () => {
            const response = await request(app)
                .get('/product')
                .set('Authorization', 'Bearer invalid.token.signature');

            expect(response.body.error?.code).toBe('UNAUTHENTICATED');
            expect(response.status).toBe(401);
        });

        it('should return 401 when token is expired', async () => {
            const jwt = await import('jsonwebtoken');
            const expiredToken = jwt.sign({ id: adminId, username: 'test_admin' }, process.env.JWT_SECRET!, {
                expiresIn: '0s',
            });

            // Wait a bit to ensure token is expired
            await new Promise((resolve) => setTimeout(resolve, 100));

            const response = await request(app)
                .get('/product')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
            expect(response.body.error?.code).toBe('UNAUTHENTICATED');
            expect(response.body.error?.message).toBe('Token expired');
        });

        it('should return 401 when token is malformed', async () => {
            const response = await request(app)
                .get('/product')
                .set('Authorization', 'Bearer malformed-token-without-three-parts');

            expect(response.status).toBe(401);
            expect(response.body.error?.code).toBe('UNAUTHENTICATED');
        });

        it('should return 401 when token has only two parts', async () => {
            const response = await request(app).get('/product').set('Authorization', 'Bearer header.payload');

            expect(response.status).toBe(401);
            expect(response.body.error?.code).toBe('UNAUTHENTICATED');
        });
    });
});
