export interface Admin {
  full_name: string;
  email: string;
  phone: string;
  is_verified: boolean;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}
