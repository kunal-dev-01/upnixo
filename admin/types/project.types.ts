// ─────────────────────────────────────────────────────────────────────────────
// types/project.types.ts
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "draft"
  | "active"
  | "in_review"
  | "completed"
  | "cancelled"
  | "disputed";

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  budget: string;
  currency: string;
  is_escrow_funded: boolean;
  status: ProjectStatus;
  priority: number;
  chat_room_id: string | null;
  repository_url: string | null;
  deadline_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_message_preview: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  freelancer_id: string | null;
  client_id: string;
}

export interface AdminUpdateProjectPayload {
  freelancer_id?: string;
  title?: string;
  description?: string;
  budget?: string; // string or decimal
  currency?: string;
  status?: ProjectStatus;
  priority?: number;
  repository_url?: string;
  deadline_at?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: number;
  currency?: string;
  page?: number;
  size?: number;
}

export interface PaginatedProjectsResponse {
  success: boolean;
  projects: Project[];
  total: number;
  page: number;
  size: number;
}

