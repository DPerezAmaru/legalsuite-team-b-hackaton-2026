import { create } from 'zustand'

interface DocumentosStore {
  pendingFiles: File[]
  setPendingFiles: (files: File[]) => void
  consumePendingFiles: () => File[]
}

export const useDocumentosStore = create<DocumentosStore>((set, get) => ({
  pendingFiles: [],
  setPendingFiles: (files) => set({ pendingFiles: files }),
  consumePendingFiles: () => {
    const files = get().pendingFiles
    if (files.length) set({ pendingFiles: [] })
    return files
  },
}))
