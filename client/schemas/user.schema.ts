// ─────────────────────────────────────────────────────────────────────────────
// schemas/user.schema.ts
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  sidebar_collapsed: z.boolean().optional(),
  compact_view: z.boolean().optional(),
  default_currency: z.string().optional(),
  language: z.string().optional(),
  notifications: z.object({
    email: z.object({
      order_updates: z.boolean(),
      chat_messages: z.boolean(),
      billing_invoices: z.boolean(),
      marketing: z.boolean(),
    }),
    push: z.object({
      mentions: z.boolean(),
      direct_messages: z.boolean(),
      security_alerts: z.boolean(),
    }),
  }).optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesSchema = z.infer<typeof updatePreferencesSchema>;
