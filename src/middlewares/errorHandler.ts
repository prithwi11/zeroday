import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const generateError = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            title: err.title,
            type: err.type,
            details: err.details,
            errors: err?.errors
        });
    } else {
        console.error("Unknown err:", err);
        const fallback = AppError.internal();
        return res.status(fallback.statusCode).json({
            success: false,
            title: fallback.title,
            type: fallback.type,
            details: fallback.details
        });
    }
};