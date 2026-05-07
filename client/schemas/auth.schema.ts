// ─────────────────────────────────────────────────────────────────────────────
// schemas/auth/auth.schema.ts
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// Reusable validation rules to maintain consistency across schemas
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password is too long");

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

const otpSchema = z
  .string()
  .length(6, "Verification code must be exactly 6 digits");

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const resendVerifySchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: passwordSchema,
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "New password cannot be the same as the current password",
    path: ["new_password"],
  });

export const confirm2FASchema = z.object({
  code: otpSchema,
});

export const verify2FASchema = z.object({
  code: otpSchema,
  two_fa_pending_token: z.string().min(1, "Pending token is required"),
});

export const verifyBackupCodeSchema = z.object({
  backup_code: z.string().min(8, "Backup code is invalid"),
  two_fa_pending_token: z.string().min(1, "Pending token is required"),
});

export const disable2FASchema = z.object({
  code: otpSchema,
});

export const regenerate2FABackupSchema = z.object({
  code: otpSchema,
});

// ─────────────────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type Confirm2FASchema = z.infer<typeof confirm2FASchema>;
export type Verify2FASchema = z.infer<typeof verify2FASchema>;
export type VerifyBackupCodeSchema = z.infer<typeof verifyBackupCodeSchema>;