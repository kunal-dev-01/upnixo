// types/api.types.ts

export interface ApiErrorResponse {
  code: number;
  message: string;
  fields?: Record<string, string>;
}