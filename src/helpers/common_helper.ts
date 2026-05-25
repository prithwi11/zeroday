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

    generateUniqueCode (firstChar: string, totalLength: number) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        
        let result = firstChar.toUpperCase();
        
        // 1. Force the first two characters to be letters
        while (result.length < 2) {
            const randomLetterIndex = Math.floor(Math.random() * letters.length);
            result += letters[randomLetterIndex];
        }
        
        // 2. Fill the remaining length with numbers
        while (result.length < totalLength) {
            const randomNumberIndex = Math.floor(Math.random() * numbers.length);
            result += numbers[randomNumberIndex];
        }
        
        return result;
    }
}
