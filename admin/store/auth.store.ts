import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Admin } from "@/types/admin.types";

interface AuthState {
  admin: Admin | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (admin: Admin, token: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  updateAdminLocally: (updates: Partial<Admin>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (admin, token) =>
        set({ admin, accessToken: token, isAuthenticated: true }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () =>
        set({ admin: null, accessToken: null, isAuthenticated: false }),
      updateAdminLocally: (updates) =>
        set((state) => ({
          admin: state.admin ? { ...state.admin, ...updates } : null,
        })),
    }),
    {
      name: "admin-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
