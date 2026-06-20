import { z } from "zod"

export const recommendationSchema = z.object({
    queryId: z.string()
});

export type RecommendationInput = z.infer<typeof recommendationSchema>;