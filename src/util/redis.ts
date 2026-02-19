import { createClient, type RedisClientType } from 'redis';
import { logger } from '../middleware/logger';

let client: RedisClientType | null = null;

export async function initRedis() {
    if (!client) {
        client = createClient({ url: process.env.REDIS_URL, socket: { connectTimeout: 2000 } });
        client.on('connect', () => logger.info('Redis connected'));
        client.on('error', () => logger.error("can't connect to redis"));
        await client.connect();
    }
    return client;
}

function createCache<TKey extends string | number>(prefix: string, ttl?: number) {
    const key = (id: TKey) => `${prefix}:${id}`;

    return {
        get: async <T>(id: TKey): Promise<T | null> => {
            if (!client) return null;
            try {
                const data = await client.get(key(id));
                return data ? (JSON.parse(data) as T) : null;
            } catch (error) {
                logger.error({ error, key: key(id), operation: 'get' }, 'Redis error');
                return null;
            }
        },
        set: async (id: TKey, value: unknown) => {
            if (!client) return;
            try {
                const str = JSON.stringify(value);
                if (ttl) {
                    await client.setEx(key(id), ttl, str);
                } else {
                    await client.set(key(id), str);
                }
            } catch (error) {
                logger.error({ error, key: key(id), operation: 'set' }, 'Redis error');
            }
        },
        del: async (id: TKey) => {
            if (!client) return;
            try {
                await client.del(key(id));
            } catch (error) {
                logger.error({ error, key: key(id), operation: 'del' }, 'Redis error');
            }
        },
    };
}

function createCompositeCache(prefix: string, ttl?: number) {
    const key = (a: number, b: string) => `${prefix}:shop_${a}:${b}`;

    return {
        get: async <T>(shopId: number, id: string): Promise<T | null> => {
            if (!client) return null;
            try {
                const data = await client.get(key(shopId, id));
                return data ? (JSON.parse(data) as T) : null;
            } catch (error) {
                logger.error({ error, key: key(shopId, id), operation: 'get' }, 'Redis error');
                return null;
            }
        },
        set: async (shopId: number, id: string, value: unknown) => {
            if (!client) return;
            try {
                const str = JSON.stringify(value);
                if (ttl) {
                    await client.setEx(key(shopId, id), ttl, str);
                } else {
                    await client.set(key(shopId, id), str);
                }
            } catch (error) {
                logger.error({ error, key: key(shopId, id), operation: 'set' }, 'Redis error');
            }
        },
        del: async (shopId: number, id: string) => {
            if (!client) return;
            try {
                await client.del(key(shopId, id));
            } catch (error) {
                logger.error({ error, key: key(shopId, id), operation: 'del' }, 'Redis error');
            }
        },
    };
}

export const cache = {
    products: createCache<string>('products', 3600),
    suppliers: createCache<string>('suppliers', 3600),
    shops: createCache<number>('shops', 3600),
    purchaseOrders: createCompositeCache('orders:purchase', 1800),
    customerOrders: createCompositeCache('orders:customer', 1800),
};

export function getRedisClient(): RedisClientType | null {
    return client;
}

export default cache;
