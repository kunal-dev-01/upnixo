import { z } from "zod";

export const blockUserSchema = z.object({
  reason: z
    .string()
    .min(3, "Reason must be at least 3 characters long")
    .max(255, "Reason cannot exceed 255 characters"),
});

export type BlockUserSchema = z.infer<typeof blockUserSchema>;
