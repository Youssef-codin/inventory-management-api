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

  describe('POST /product/add', () => {
    it('should create a new product', async () => {
      const response = await request(app)
        .post('/product/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          category: 'Electronics',
          unitPrice: 99.99,
          stockQuantity: 10,
          reorderLevel: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should fail if missing required fields', async () => {
      const response = await request(app)
        .post('/product/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /product/:id', () => {
    it('should get a product by id', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Existing Product',
          category: 'Tools',
          unitPrice: 50.00,
          stockQuantity: 20,
        },
      });

      const response = await request(app)
        .get(`/product/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // ID is omitted in the service response
      expect(response.body.data.name).toBe(product.name);
    });

    it('should return 404 for non-existent product', async () => {
      const uuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/product/${uuid}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /product/search', () => {
    it('should search products by name', async () => {
      await prisma.product.create({
        data: {
          name: 'Search Me',
          category: 'Test',
          unitPrice: 10,
        },
      });

      const response = await request(app)
        .get('/product/search?name=Search')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Search Me');
    });
  });

  describe('PUT /product/:id', () => {
    it('should update a product', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Old Name',
          category: 'Tools',
          unitPrice: 50.00,
        },
      });

      const response = await request(app)
        .put(`/product/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
          category: 'Tools',
          unitPrice: 50.00,
          stockQuantity: 0,
          reorderLevel: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Name');
    });
  });

  describe('DELETE /product/:id', () => {
    it('should delete a product', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'To Delete',
          category: 'Tools',
          unitPrice: 50.00,
        },
      });

      const response = await request(app)
        .delete(`/product/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      const check = await prisma.product.findUnique({ where: { id: product.id } });
      expect(check).toBeNull();
    });
  });
});
