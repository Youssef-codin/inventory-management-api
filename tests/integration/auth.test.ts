import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDb, createTestAdmin } from '../helpers';
import { prisma } from '../../src/util/prisma';
import { hashPassword } from '../../src/util/auth';

describe('Auth Module', () => {
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

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(typeof response.body.data).toBe('string'); // JWT
      // Ensure passwordHash is not returned (though login endpoint usually just returns token)
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should fail with 401 for invalid password', async () => {
      await prisma.admin.create({
        data: {
          username: 'admin',
          passwordHash: await hashPassword('correct'),
        },
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'wrong',
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error?.code).toBe('INVALID_CREDENTIALS');
      expect(response.status).toBe(401);
    });

    it('should fail with 401 for invalid username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error?.code).toBe('INVALID_CREDENTIALS');
      expect(response.status).toBe(401);
    });

    it('should fail with 400 for missing fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          // missing password
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error?.code).toBe('VALIDATION_FAILED');
      expect(response.status).toBe(400);
    });
  });

  describe('Auth Middleware (Global)', () => {
    // We can use a protected route like /product/add or just /product to test middleware
    
    it('should return 401 when requesting protected route without Authorization', async () => {
      const response = await request(app).get('/product');
      expect(response.body.success).toBe(false);
      expect(response.body.error?.code).toBe('UNAUTHENTICATED');
      expect(response.status).toBe(401);
    });

    it('should return 401 when Authorization header has wrong scheme', async () => {
        // e.g. "Basic ..." instead of "Bearer ..."
        const response = await request(app)
            .get('/product')
            .set('Authorization', 'Basic 123456');
        
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
  });
});