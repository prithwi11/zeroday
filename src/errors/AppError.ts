type ValidationIssue = { path: string; message: string };

class AppError extends Error {
    public statusCode: number;
    public type: string;
    public title: string;
    public details: string;
    public errors?: ValidationIssue[] | undefined;

    constructor(
        message: string,
        statusCode: number,
        type: string,
        title: string,
        details: string,
        errors?: ValidationIssue[]
    ) {
        super(message);

        this.statusCode = statusCode;
        this.type = type;
        this.title = title;
        this.details = details;
        this.errors = errors;
        this.name = "AppError";

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(details: string = "The request parameters are invalid.", errors?: ValidationIssue[]): AppError {
        return new AppError(details, 400, "validation_error", "Bad Request", details, errors);
    }

    static tooManyRequests(details: string = "Too many requests. Please try again later."): AppError {
        return new AppError(details, 429, "rate_limit_error", "Too Many Requests", details);
    }

    static internal(details: string = "An unexpected error occurred on our server."): AppError {
        return new AppError(details, 500, "api_error", "Internal Server Error", details);
    }
}

export { AppError };
export type { ValidationIssue };