import { z } from "zod";

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  budget: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Budget must be a valid number greater than 0"),
  currency: z
    .string()
    .min(3)
    .max(3, "Currency must be a 3-character ISO code (e.g. USD, INR)"),
  priority: z
    .number()
    .int()
    .min(0, "Priority must be at least 0")
    .max(2, "Priority can be at most 2"),
  deadline_at: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "Deadline cannot be in the past"),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z
    .number()
    .int()
    .min(0, "Priority must be at least 0")
    .max(2, "Priority can be at most 2"),
  repository_url: z
    .string()
    .url("Repository URL must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;

