import z from 'zod';

export function inParams<P extends z.ZodObject<any>>(object: P) {
    return z.object({
        params: object,
    });
}

export function inBody<B extends z.ZodObject<any>>(object: B) {
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

export function inQuery<Q extends z.ZodObject<any>>(query: Q) {
    return z.object({
        query: query,
    });
}
