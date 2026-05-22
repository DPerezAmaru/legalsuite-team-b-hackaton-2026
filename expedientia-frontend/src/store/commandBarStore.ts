import { create } from 'zustand'

interface CommandBarStore {
  isOpen: boolean
  pendingPrompt: string | null
  open: () => void
  close: () => void
  toggle: () => void
  setPendingPrompt: (text: string) => void
  consumePendingPrompt: () => string | null
}

export const useCommandBar = create<CommandBarStore>((set, get) => ({
  isOpen: false,
  pendingPrompt: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set(s => ({ isOpen: !s.isOpen })),
  setPendingPrompt: (text) => set({ pendingPrompt: text }),
  consumePendingPrompt: () => {
    const text = get().pendingPrompt
    if (text) set({ pendingPrompt: null })
    return text
  },
}))
