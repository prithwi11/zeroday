import { z } from "zod";

export const registerUserSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(100),
    email: z.string().email("A valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
    email: z.string().email("A valid email is required"),
    password: z.string().min(1, "Password is required"),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;