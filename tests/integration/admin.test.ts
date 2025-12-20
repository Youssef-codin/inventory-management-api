import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDb, createTestAdmin, getAuthToken } from '../helpers';
import { prisma } from '../../src/util/prisma';
import { hashPassword } from '../../src/util/auth';

describe('Admin Module', () => {
  let authToken: string;
  let testAdmin: any;

  beforeEach(async () => {
    await resetDb();
    testAdmin = await createTestAdmin();
    authToken = getAuthToken(testAdmin.id, testAdmin.username);
  });

  describe('POST /admin/add', () => {
    it('should create a new admin', async () => {
      const response = await request(app)
        .post('/admin/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: `newadmin_${Date.now()}`,
          password: 'newpassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });
  });

  describe('GET /admin/search', () => {
    it('should search admin by username', async () => {
      const response = await request(app)
        .get(`/admin/search?username=${testAdmin.username}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      const found = response.body.data.find((a: any) => a.username === testAdmin.username);
      expect(found).toBeDefined();
    });
  });

  describe('GET /admin/:id', () => {
    it('should get an admin by id', async () => {
      const newAdmin = await prisma.admin.create({
        data: {
          username: `anotheradmin_${Date.now()}`,
          passwordHash: await hashPassword('pass')
        }
      });

      const response = await request(app)
        .get(`/admin/${newAdmin.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(newAdmin.id);
    });
  });

  describe('PUT /admin/:id', () => {
    it('should update an admin', async () => {
      const newAdmin = await prisma.admin.create({
        data: {
          username: `updateadmin_${Date.now()}`,
          passwordHash: await hashPassword('pass')
        }
      });

      const response = await request(app)
        .put(`/admin/${newAdmin.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: `updatedadmin_${Date.now()}`,
          password: 'newpass', // Assuming schema requires password or allows it
        });

      // If schema requires full update, this might fail with 400.
      // Let's assume schema allows partial or we provide what's needed.
      // If 400 persists, we check schema.

      if (response.status === 400) {
        console.log("PUT Error Body:", response.body);
      }
      expect(response.status).toBe(200);
      expect(response.body.data.username).toContain('updatedadmin');
    });
  });

  describe('DELETE /admin/:id', () => {
    it('should delete an admin', async () => {
      const newAdmin = await prisma.admin.create({
        data: {
          username: `deleteadmin_${Date.now()}`,
          passwordHash: await hashPassword('pass')
        }
      });

      const response = await request(app)
        .delete(`/admin/${newAdmin.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      const check = await prisma.admin.findUnique({ where: { id: newAdmin.id } });
      expect(check).toBeNull();
    });
  });
});
