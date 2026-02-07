import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const privateKey = process.env.JWT_SECRET;

if (!privateKey) throw new Error('JWT env variables not set');
const jwtSecret = privateKey;

export function makeJWT(UUID: string, username: string) {
    return jwt.sign(
        {
            sub: UUID,
            name: username,
        },
        jwtSecret,
        { algorithm: 'HS256', expiresIn: '1h' },
    );
}

export function verifyJWT(token: string) {
    const verified = jwt.verify(token, jwtSecret) as JwtPayload;
    return verified.sub;
}

export async function hashPassword(passwordStr: string) {
    return await bcrypt.hash(passwordStr, 10);
}

export async function comparePass(inputPass: string, hashedPass: string): Promise<boolean> {
    return await bcrypt.compare(inputPass, hashedPass);
}
