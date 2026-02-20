import z from 'zod';

export function inParams<P extends z.ZodObject<z.ZodRawShape>>(object: P) {
    return z.object({
        params: object,
    });
}

export function inBody<B extends z.ZodObject<z.ZodRawShape>>(object: B) {
    return z.object({
        body: object,
    });
}

export function inBodyAndParams<P extends z.ZodObject, B extends z.ZodObject>(params: P, object: B) {
    return z.object({
        params: params,
        body: object,
    });
}

export function inQuery<Q extends z.ZodObject<z.ZodRawShape>>(query: Q) {
    return z.object({
        query: query,
    });
}
