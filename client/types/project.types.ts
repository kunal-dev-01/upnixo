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
  budget: string; // Received as string from decimal type in backend
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
  freelancer_id: string;
  client_id: string;
}

export interface CreateProjectPayload {
  freelancer_id: string;
  title: string;
  description: string;
  budget: string;
  currency: string;
  priority: number;
  deadline_at?: string;
}

export interface ClientUpdateProjectPayload {
  title?: string;
  description?: string;
  priority?: number;
  repository_url?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: number;
  currency?: string;
  page?: number;
  size?: number;
}
