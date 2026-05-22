import { create } from 'zustand'

interface DocumentosStore {
  pendingFile: File | null
  setPendingFile: (file: File) => void
  consumePendingFile: () => File | null
}

export const useDocumentosStore = create<DocumentosStore>((set, get) => ({
  pendingFile: null,
  setPendingFile: (file) => set({ pendingFile: file }),
  consumePendingFile: () => {
    const file = get().pendingFile
    if (file) set({ pendingFile: null })
    return file
  },
}))
