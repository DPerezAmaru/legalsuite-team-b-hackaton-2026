import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'expedientia:theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', resolveTheme(theme))
}

function persistTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* localStorage puede no estar disponible (modo privado, quota) */
  }
}

interface ThemeStore {
  theme: Theme
  resolved: ResolvedTheme
  setTheme: (theme: Theme) => void
  cycle: () => void
}

const initialTheme = readStoredTheme()

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: initialTheme,
  resolved: resolveTheme(initialTheme),
  setTheme: (theme) => {
    persistTheme(theme)
    applyTheme(theme)
    set({ theme, resolved: resolveTheme(theme) })
  },
  cycle: () => {
    const current = get().theme
    const next: Theme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'
    persistTheme(next)
    applyTheme(next)
    set({ theme: next, resolved: resolveTheme(next) })
  },
}))

if (typeof window !== 'undefined') {
  // Re-aplica por las dudas (el script inline en index.html ya lo hace)
  applyTheme(initialTheme)

  // Si el usuario eligió 'system', seguimos al SO en vivo
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useTheme.getState().theme === 'system') {
      applyTheme('system')
      useTheme.setState({ resolved: getSystemTheme() })
    }
  })
}
