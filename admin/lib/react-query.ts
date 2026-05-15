// ─────────────────────────────────────────────────────────────────────────────
// lib/react-query.ts
// ─────────────────────────────────────────────────────────────────────────────

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000, // 10 min
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
