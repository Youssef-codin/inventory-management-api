import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDb, createTestAdmin, getAuthToken } from '../helpers';
import { prisma } from '../../src/util/prisma';

describe('Customer Order Module', () => {
  let authToken: string;
  let adminId: string;
  let productId: string;

  beforeEach(async () => {
    await resetDb();
    const admin = await createTestAdmin();
    adminId = admin.id;
    authToken = getAuthToken(admin.id, admin.username);

    // Create a product for the order
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        category: 'Test',
        unitPrice: 100.00,
        stockQuantity: 50,
      },
    });
    productId = product.id;
  });

  describe('POST /customer-order/add', () => {
    it('should create a new customer order', async () => {
      const response = await request(app)
        .post('/customer-order/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          adminId: adminId,
          orderDate: new Date().toISOString(),
          totalAmount: 200.00,
          items: [
            {
              productId: productId,
              quantity: 2,
              unitPrice: 100.00
            }
          ]
        });

      // Expect 201 for creation
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.items).toHaveLength(1);
      // Prisma Decimal returns as string in JSON
      expect(Number(response.body.data.totalAmount)).toBe(200.00);
    });
  });

  describe('GET /customer-order/:id', () => {
    it('should get a customer order by id', async () => {
      // Manually create an order first
      const order = await prisma.customerOrder.create({
        data: {
          adminId: adminId,
          totalAmount: 300.00,
          items: {
            create: [
              {
                productId: productId,
                quantity: 3,
                unitPrice: 100.00
              }
            ]
          }
        },
        include: { items: true }
      });

      const response = await request(app)
        .get(`/customer-order/${order.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(order.id);
      expect(response.body.data.items).toHaveLength(1);
    });
  });
  
  describe('DELETE /customer-order/:id', () => {
    it('should delete a customer order', async () => {
      const order = await prisma.customerOrder.create({
        data: {
          adminId: adminId,
          totalAmount: 100.00,
          items: {
            create: [
              {
                productId: productId,
                quantity: 1,
                unitPrice: 100.00
              }
            ]
          }
        }
      });

      const response = await request(app)
        .delete(`/customer-order/${order.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      
      const check = await prisma.customerOrder.findUnique({ where: { id: order.id } });
      expect(check).toBeNull();
    });
  });
});
