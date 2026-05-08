// @/store/sidebar.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isPinned: boolean;
  togglePin: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isPinned: false,
      togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
    }),
    {
      name: "sidebar-storage",
    },
  ),
);
