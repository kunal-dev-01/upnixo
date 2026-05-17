// ─────────────────────────────────────────────────────────────────────────────
// types/milestone.types.ts
// ─────────────────────────────────────────────────────────────────────────────

export type MilestoneStatus =
  | "pending_funding"
  | "funded"
  | "in_progress"
  | "in_review"
  | "approved"
  | "released"
  | "disputed";

export interface Milestone {
  id: string;
  project_id: string;
  order_index: number;
  title: string;
  description: string | null;
  amount: string; // Decimal from backend comes as string
  status: MilestoneStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMilestonePayload {
  project_id: string;
  order_index: number;
  title: string;
  description?: string;
  amount: string;
  due_date?: string;
}

export interface UpdateMilestonePayload {
  order_index?: number;
  title?: string;
  description?: string;
  amount?: string;
  status?: MilestoneStatus;
  due_date?: string;
}
