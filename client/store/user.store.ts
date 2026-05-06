// store/user.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserPreferences } from '@/types/user.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  
  // Auth Actions
  setAuth: (user: User) => void;
  clearAuth: () => void;
  
  // Partial Update Actions (For Optimistic UI updates)
  updateUserLocally: (updates: Partial<User>) => void;
  updatePreferencesLocally: (updates: Partial<UserPreferences>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
      updateUserLocally: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      updatePreferencesLocally: (updates) =>
        set((state) => {
          if (!state.user || !state.user.preferences) return state; // Safety check
          
          return {
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                ...updates,
              },
            },
          };
        }),
    }),
    {
      name: 'auth-storage', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);