import { Admin } from "./admin.types";

export interface AdminLoginRequest {
  email: string;
  password: string;
  master_secret_key: string;
}

export interface AdminVerifyRequest {
  email: string;
  code: string;
}

export interface AdminResetPasswordRequest {
  token: string;
  password: string;
}

export interface AdminResetMasterKeyRequest {
  token: string;
  master_key: string;
}

export interface AdminAuthResponse {
  success: boolean;
  access_token: string;
  admin: Admin;
}

export interface RefreshResponse {
  success: boolean;
  access_token: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface SessionView {
  id: string;
  ip_address: string;
  browser: string;
  os: string;
  device_name: string;
  city: string;
  country: string;
  is_current: boolean;
  created_at: string;
  expires_at: string;
}

export interface SessionsResponse {
  success: boolean;
  sessions: SessionView[];
}
