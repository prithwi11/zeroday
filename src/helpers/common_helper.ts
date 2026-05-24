import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class CommonHelper {
    hashPassword = async (password: string): Promise<string> => {
        console.log("hashPassworddddddddd", password)
        return await bcrypt.hash(password, 10);
    };
    
    comparePassword = async (password: string, hash: string): Promise<boolean> => {
        return await bcrypt.compare(password, hash);
    };
    
    generateToken = (payload: object): string => {
        const options: SignOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any // Cast to bypass strict type matching
        };

        return jwt.sign(payload, process.env.JWT_SECRET as string, options);
    };
    
    verifyToken = (token: string): any => {
        return jwt.verify(token, process.env.JWT_SECRET as string);
    };
}
