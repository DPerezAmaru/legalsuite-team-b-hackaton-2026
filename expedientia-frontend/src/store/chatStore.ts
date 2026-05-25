import { create } from 'zustand'
import type { ChatMessage } from '../types'

interface ChatStore {
  conversations: Record<number, ChatMessage[]>
  getMessages: (expedienteId: number) => ChatMessage[]
  addMessage: (expedienteId: number, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  addMessages: (expedienteId: number, msgs: ChatMessage[]) => void
  clearConversation: (expedienteId: number) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: {},
  getMessages: (expedienteId) => get().conversations[expedienteId] ?? [],
  addMessage: (expedienteId, msg) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [expedienteId]: [
          ...(state.conversations[expedienteId] ?? []),
          { ...msg, id: crypto.randomUUID(), timestamp: new Date() },
        ],
      },
    })),
  addMessages: (expedienteId, msgs) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [expedienteId]: [...(state.conversations[expedienteId] ?? []), ...msgs],
      },
    })),
  clearConversation: (expedienteId) =>
    set((state) => {
      const next = { ...state.conversations }
      delete next[expedienteId]
      return { conversations: next }
    }),
}))
