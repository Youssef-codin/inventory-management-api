import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDb, createTestAdmin, getAuthToken } from '../helpers';
import { prisma } from '../../src/util/prisma';

describe('Purchase Order Module', () => {
  let authToken: string;
  let adminId: string;
  let productId: string;
  let supplierId: string;

  beforeEach(async () => {
    await resetDb();
    const admin = await createTestAdmin();
    adminId = admin.id;
    authToken = getAuthToken(admin.id, admin.username);

    // Create a product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        category: 'Test',
        unitPrice: 100.00,
        stockQuantity: 50,
      },
    });
    productId = product.id;

    // Create a supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: 'Test Supplier',
        contactEmail: 'test@supplier.com',
        phone: '1234567890',
        address: '123 Supplier St',
      },
    });
    supplierId = supplier.id;
  });

  describe('POST /purchase-order/add', () => {
    it('should create a new purchase order', async () => {
      const response = await request(app)
        .post('/purchase-order/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          adminId: adminId,
          supplierId: supplierId,
          orderDate: new Date().toISOString(),
          totalAmount: 1000.00,
          arrived: false,
          items: [
            {
              productId: productId,
              quantity: 10,
              unitPrice: 100.00
            }
          ]
        });

      // Expect 201 for creation
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.items).toHaveLength(1);
    });
  });

  describe('GET /purchase-order/:id', () => {
    it('should get a purchase order by id', async () => {
      // Manually create an order
      const order = await prisma.purchaseOrder.create({
        data: {
          adminId: adminId,
          supplierId: supplierId,
          totalAmount: 1000.00,
          items: {
            create: [
              {
                productId: productId,
                quantity: 10,
                unitPrice: 100.00
              }
            ]
          }
        },
        include: { items: true }
      });

      const response = await request(app)
        .get(`/purchase-order/${order.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(order.id);
    });
  });

  describe('DELETE /purchase-order/:id', () => {
    it('should delete a purchase order', async () => {
      const order = await prisma.purchaseOrder.create({
        data: {
          adminId: adminId,
          supplierId: supplierId,
          totalAmount: 500.00,
          items: {
            create: [
              {
                productId: productId,
                quantity: 5,
                unitPrice: 100.00
              }
            ]
          }
        }
      });

      const response = await request(app)
        .delete(`/purchase-order/${order.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      const check = await prisma.purchaseOrder.findUnique({ where: { id: order.id } });
      expect(check).toBeNull();
    });
  });
});
