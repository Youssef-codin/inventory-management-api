import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validate } from '../../src/middleware/validate';
import { inBody } from '../../src/util/schema.helper';
import z from 'zod';
import { Decimal } from '@prisma/client/runtime/client';

const schema = inBody(z.object({
  val: z.union([
    z.instanceof(Decimal),
    z.number().transform(n => new Decimal(n)),
  ]),
}));

describe('Validation Middleware', () => {
  it('should transform number to Decimal', async () => {
    const app = express();
    app.use(express.json());

    app.post('/test', validate(schema), (req, res) => {
      res.json({
        value: req.body.val.toString(),
      });
    });

    const response = await request(app)
      .post('/test')
      .send({ val: 123 });

    expect(response.status).toBe(200);
    expect(response.body).toBe(true);
    expect(response.body.value).toBe('123');
  });

  it('should handle decimal input (100.53)', async () => {
    const app = express();
    app.use(express.json());

    app.post('/test', validate(schema), (req, res) => {
      res.json({
        isDecimal: req.body.val instanceof Decimal,
        value: req.body.val.toString(),
      });
    });

    const response = await request(app)
      .post('/test')
      .send({ val: 100.53 });

    expect(response.status).toBe(200);
    expect(response.body.isDecimal).toBe(true);
    expect(response.body.value).toBe('100.53');
  });

  it('should reject if val is missing', async () => {
    const app = express();
    app.use(express.json());

    app.post('/test', validate(schema), (req, res) => {
      res.json({ ok: true });
    });

    const response = await request(app)
      .post('/test')
      .send({}); // missing 'val'

    expect(response.status).toBe(400); // validation error
  });
});
