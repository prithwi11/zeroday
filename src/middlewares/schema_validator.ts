import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError, ValidationIssue } from "../errors/AppError";

export const validateSchema = (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[target]);
 
        if (!result.success) {
            const formattedErrors: ValidationIssue[] = result.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            }));

            const validationError = AppError.badRequest(
                "The requested parameters or payload failed validation constraints.", 
                formattedErrors
            );           
            return next(validationError);
        }

        req[target] = result.data;
        return next();
    };
};