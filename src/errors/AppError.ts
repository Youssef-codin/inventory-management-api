import { ERROR_CODE } from "../middleware/errorHandler";

export class AppError extends Error {
    status: number;
    code: ERROR_CODE;

    constructor(status = 500, message: string, code: ERROR_CODE) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
