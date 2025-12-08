import { ERROR_CODE } from "../middleware/errorHandler";

export class AppError extends Error {
    status: number;
    code: ERROR_CODE;

    constructor(message: string, status = 500, code: ERROR_CODE) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
