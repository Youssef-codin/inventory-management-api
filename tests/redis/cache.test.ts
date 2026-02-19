import { beforeAll, describe, expect, it, vi } from 'vitest';
import { cache, getRedisClient, initRedis } from '../../src/util/redis.js';

// Set Redis URL for host machine access (tests run outside Docker)
process.env.REDIS_URL = 'redis://:redispass123@localhost:6380';

describe('Redis - Graceful degradation', () => {
    beforeAll(async () => {
        await initRedis();
    });

    describe('when Redis fails mid-operation', () => {
        it('get should return null gracefully instead of throwing', async () => {
            await cache.products.set('1', { id: '1', name: 'Test' });

            const before = await cache.products.get('1');
            expect(before).toEqual({ id: '1', name: 'Test' });

            const redisClient = getRedisClient() as any;
            const originalGet = redisClient.get.bind(redisClient);
            redisClient.get = vi.fn().mockRejectedValue(new Error('Connection lost'));

            // Should return null, not throw
            const result = await cache.products.get('1');
            expect(result).toBeNull();

            redisClient.get = originalGet;
        });

        it('set should complete gracefully instead of throwing', async () => {
            const redisClient = getRedisClient() as any;
            const originalSet = redisClient.set.bind(redisClient);
            redisClient.set = vi.fn().mockRejectedValue(new Error('Connection lost'));

            // Should complete without throwing
            await expect(cache.products.set('2', { id: '2', name: 'Test' })).resolves.toBeUndefined();

            redisClient.set = originalSet;
        });

        it('del should complete gracefully instead of throwing', async () => {
            const redisClient = getRedisClient() as any;
            const originalDel = redisClient.del.bind(redisClient);
            redisClient.del = vi.fn().mockRejectedValue(new Error('Connection lost'));

            // Should complete without throwing
            await expect(cache.products.del('1')).resolves.toBeUndefined();

            redisClient.del = originalDel;
        });
    });

    describe('when client is null (Redis never connected)', () => {
        it('get should return null gracefully', async () => {
            const redisClient = getRedisClient() as any;

            await redisClient.quit();

            const result = await cache.products.get('1');
            expect(result).toBeNull();

            await initRedis();
        });
    });
});
