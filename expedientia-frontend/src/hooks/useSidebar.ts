import { create } from 'zustand'

const startOpen = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

interface SidebarStore {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useSidebar = create<SidebarStore>((set) => ({
  isOpen: startOpen,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}))
