import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app';
import { hashPassword } from '../../src/util/auth';
import { prisma } from '../../src/util/prisma';
import { createTestAdmin, getAuthToken, resetDb } from '../helpers';

describe('Admin Module - Integration', () => {
    let authToken: string;
    let testAdmin: any;

    beforeEach(async () => {
        await resetDb();
        testAdmin = await createTestAdmin();
        authToken = getAuthToken(testAdmin.id, testAdmin.username);
    });

    describe('POST /admin/add', () => {
        it('should create new admin and hash password', async () => {
            const response = await request(app)
                .post('/admin/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    username: 'newadmin',
                    password: 'password123',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.username).toBe('newadmin');

            const created = await prisma.admin.findUnique({ where: { username: 'newadmin' } });
            expect(created).not.toBeNull();
            expect(created?.passwordHash).not.toBe('password123');
        });

        it('should handle duplicate username', async () => {
            await request(app)
                .post('/admin/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ username: 'dup', password: 'password' });

            const response = await request(app)
                .post('/admin/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ username: 'dup', password: 'password' });

            if (response.status === 500) {
                console.warn('Duplicate username returned 500, expected 409 per requirements.');
            }
            expect(response.body.error?.code).toBe('USERNAME_TAKEN');
            expect(response.status).toBe(409);
        });
    });

    describe('GET /admin/search', () => {
        it('should return 200 array with matches', async () => {
            const response = await request(app)
                .get(`/admin/search?username=${testAdmin.username}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });

        it('should return 200 empty array for no matches', async () => {
            const response = await request(app)
                .get(`/admin/search?username=nomatch`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });
    });

    describe('DELETE /admin/:id', () => {
        it('should return 204 for existing admin', async () => {
            const newAdmin = await prisma.admin.create({
                data: { username: 'todelete', passwordHash: 'hash' },
            });
            const response = await request(app)
                .delete(`/admin/${newAdmin.id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(204);
        });

        it('should return 404 for non-existent admin', async () => {
            const response = await request(app)
                .delete(`/admin/00000000-0000-0000-0000-000000000000`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.body.error?.code).toBe('NOT_FOUND');
            expect(response.status).toBe(404);
        });
    });

    describe('GET /admin', () => {
        it('should return 200 and list of admins', async () => {
            const response = await request(app).get('/admin').set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
        });
    });

    describe('GET /admin/:id', () => {
        it('should return 200 for existing admin', async () => {
            const response = await request(app)
                .get(`/admin/${testAdmin.id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data.username).toBe(testAdmin.username);
        });

        it('should return 404 for non-existent admin', async () => {
            const response = await request(app)
                .get('/admin/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('PUT /admin/:id', () => {
        it('should update admin username', async () => {
            const newAdmin = await prisma.admin.create({
                data: { username: 'update_me', passwordHash: 'hash' },
            });
            const response = await request(app)
                .put(`/admin/${newAdmin.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ username: 'updated_user', password: 'newpassword123' });

            expect(response.status).toBe(200);
            expect(response.body.data.username).toBe('updated_user');

            const check = await prisma.admin.findUnique({ where: { id: newAdmin.id } });
            expect(check?.username).toBe('updated_user');
        });

        it('should hash password when updating', async () => {
            const newAdmin = await prisma.admin.create({
                data: { username: 'update_pass', passwordHash: 'old_hash' },
            });

            const response = await request(app)
                .put(`/admin/${newAdmin.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ username: 'update_pass', password: 'newpassword123' });

            expect(response.status).toBe(200);
            expect(response.body.data.username).toBe('update_pass');

            const check = await prisma.admin.findUnique({ where: { id: newAdmin.id } });
            expect(check?.passwordHash).not.toBe('old_hash');
            expect(check?.passwordHash).not.toBe('newpassword123');
        });

        it('should return 404 for non-existent admin', async () => {
            const response = await request(app)
                .put('/admin/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ username: 'ghost', password: 'newpassword123' });

            expect(response.status).toBe(404);
            expect(response.body.error?.code).toBe('NOT_FOUND');
        });
    });
});
