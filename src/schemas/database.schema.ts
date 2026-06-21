import { z } from "zod";

const dbConnectionSchema = z.object({
    host: z.string().min(1, "Host is required"),
    // port: z.number().int().min(1).max(65535),
    // database: z.string().min(1, "Database name is required"),
    user: z.string().min(1, "Database user is required"),
    password: z.string().min(1, "Password is required"),
});

export const createDatabaseSchema = z.object({
    database_name: z.string().min(1).max(100),
    // type: z.enum(["postgres"]), // add more here as you support them
    db_connection: dbConnectionSchema,
});

export type CreateDatabaseInput = z.infer<typeof createDatabaseSchema>;

export const databaseIdSchema = z.object({
    database_id: z.number().int().positive("database_id must be a valid positive integer"),
});

export type DatabaseIdInput = z.infer<typeof databaseIdSchema>;