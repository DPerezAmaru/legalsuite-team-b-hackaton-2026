import { create } from 'zustand'

interface UsuarioStore {
  usuarioId: number | null
  setUsuarioId: (id: number | null) => void
}

export const useUsuarioStore = create<UsuarioStore>((set) => ({
  usuarioId: 1,
  setUsuarioId: (id) => set({ usuarioId: id }),
}))
