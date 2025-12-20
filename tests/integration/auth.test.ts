import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { resetDb } from '../helpers';
import { prisma } from '../../src/util/prisma';
import { hashPassword } from '../../src/util/auth';

describe('Auth Module', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const password = 'password123';
      const passwordHash = await hashPassword(password);
      
      await prisma.admin.create({
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
      expect(response.body.data).toEqual(expect.any(String)); // Should return JWT
    });

    it('should fail with invalid credentials', async () => {
      const uniqueName = `admin_fail_${Date.now()}`;
      await prisma.admin.create({
        data: {
          username: uniqueName,
          passwordHash: await hashPassword('password123'),
        },
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: uniqueName,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should fail if user does not exist', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            username: 'nonexistent',
            password: 'password123',
          });
  
        expect(response.status).toBe(401);
      });
  });
});
