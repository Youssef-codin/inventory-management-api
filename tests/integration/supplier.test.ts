import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDb, createTestAdmin, getAuthToken } from '../helpers';
import { prisma } from '../../src/util/prisma';

describe('Supplier Module', () => {
  let authToken: string;

  beforeEach(async () => {
    await resetDb();
    const admin = await createTestAdmin();
    authToken = getAuthToken(admin.id, admin.username);
  });

  describe('POST /supplier/add', () => {
    it('should create a new supplier', async () => {
      const response = await request(app)
        .post('/supplier/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Supplier',
          contactEmail: 'test@supplier.com',
          phone: '1234567890',
          address: '123 Test St',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Supplier');
    });
  });

  describe('GET /supplier/:id', () => {
    it('should get a supplier by id', async () => {
      const supplier = await prisma.supplier.create({
        data: {
          name: 'Existing Supplier',
          contactEmail: 'exists@supplier.com',
          phone: '9876543210',
          address: '456 Existing Rd',
        },
      });

      const response = await request(app)
        .get(`/supplier/${supplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(supplier.id);
    });
  });

  describe('PUT /supplier/:id', () => {
    it('should update a supplier', async () => {
      const supplier = await prisma.supplier.create({
        data: {
          name: 'Old Supplier',
          contactEmail: 'old@supplier.com',
          phone: '1111111111',
          address: 'Old Address',
        },
      });

      const response = await request(app)
        .put(`/supplier/${supplier.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Supplier',
          contactEmail: 'old@supplier.com',
          phone: '1111111111',
          address: 'Old Address',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Supplier');
    });
  });

  describe('DELETE /supplier/:id', () => {
    it('should delete a supplier', async () => {
      const supplier = await prisma.supplier.create({
        data: {
          name: 'To Delete',
          contactEmail: 'delete@supplier.com',
          phone: '0000000000',
          address: 'Delete Lane',
        },
      });

      const response = await request(app)
        .delete(`/supplier/${supplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      const check = await prisma.supplier.findUnique({ where: { id: supplier.id } });
      expect(check).toBeNull();
    });
  });
});
