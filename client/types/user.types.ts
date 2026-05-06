// types/user.types.ts

export interface NotificationSettings {
  email: {
    order_updates: boolean;
    chat_messages: boolean;
    billing_invoices: boolean;
    marketing: boolean;
  };
  push: {
    mentions: boolean;
    direct_messages: boolean;
    security_alerts: boolean;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
  compact_view: boolean;
  notifications: NotificationSettings;
  default_currency: string;
  language: string;
}

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  phone_verified: boolean;
  timezone: string;
  locale: string;
  two_factor_enabled: boolean;
  preferences?: UserPreferences;
  last_login_at?: string;
  created_at: string;
}

// Payloads for API requests
export interface UpdateUserPayload {
  full_name?: string;
  avatar_url?: string;
  timezone?: string;
  locale?: string;
}

export interface UpdatePreferencesPayload {
  theme?: 'light' | 'dark' | 'system';
  sidebar_collapsed?: boolean;
  compact_view?: boolean;
  notifications?: NotificationSettings; // Yahan JSON override hoga backend pe
  default_currency?: string;
  language?: string;
}