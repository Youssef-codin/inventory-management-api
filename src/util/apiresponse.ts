import type { Response } from 'express';
import type { ERROR_CODE } from '../middleware/errorHandler';

export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: {
        code: ERROR_CODE;
        message: string;
    };
};

export const ok = <T>(data: T): ApiResponse<T> => ({
    success: true,
    data,
});

export const fail = (message: string, code: ERROR_CODE): ApiResponse => ({
    success: false,
    error: { message, code },
});

export function respond(res: Response, status: number, response: ApiResponse) {
    res.status(status).json(response);
}
