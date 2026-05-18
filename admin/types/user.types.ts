// ─────────────────────────────────────────────────────────────────────────────
// types/user.types.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  sidebar_collapsed: boolean;
  compact_view: boolean;
  default_currency: string;
  language: string;
}

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  phone?: string | null;
  phone_verified: boolean;
  full_name: string;
  avatar_url?: string | null;
  timezone: string;
  locale: string;
  is_active: boolean;
  is_blocked: boolean;
  blocked_at?: string | null;
  blocked_reason?: string | null;
  two_factor_enabled: boolean;
  preferences?: UserPreferences | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFilters {
  search?: string;
  status?: string;
  is_active?: boolean;
  is_blocked?: boolean;
  email_verified?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedUsersResponse {
  success: boolean;
  users: User[];
  total: number;
  page: number;
  limit: number;
}
