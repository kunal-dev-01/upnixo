// store/user.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserPreferences } from '../types/user.types';

interface AuthState {
  user: User | null;
  accessToken: string | null; 
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  updateUserLocally: (updates: Partial<User>) => void;
  updatePreferencesLocally: (updates: Partial<UserPreferences>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      updateUserLocally: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      updatePreferencesLocally: (updates) =>
        set((state) => {
          if (!state.user || !state.user.preferences) return state;
          return {
            user: { ...state.user, preferences: { ...state.user.preferences, ...updates } },
          };
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }), 
    }
  )
);