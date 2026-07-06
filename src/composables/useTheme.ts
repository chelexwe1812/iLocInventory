import { computed, ref, watch } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'iloc-theme'
const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: '#09090b',
  light: '#fafafa',
}

function readStoredPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    // localStorage no disponible
  }
  return 'dark'
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true
}

// Estado a nivel de módulo: un único origen de verdad compartido por toda la app.
const preference = ref<ThemePreference>(readStoredPreference())
const systemDark = ref(systemPrefersDark())

const resolvedTheme = computed<ResolvedTheme>(() =>
  preference.value === 'system' ? (systemDark.value ? 'dark' : 'light') : preference.value,
)

function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLORS[theme])
}

let initialized = false

/**
 * Composable de tema (claro / oscuro / sistema).
 * Aplica el tema al elemento raíz y lo persiste en localStorage.
 * El estado es un singleton, por lo que cualquier componente que lo use
 * comparte y reacciona a los mismos cambios.
 */
export function useTheme() {
  if (!initialized) {
    initialized = true
    applyTheme(resolvedTheme.value)
    watch(resolvedTheme, applyTheme)

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          systemDark.value = e.matches
        })
    }
  }

  function setTheme(next: ThemePreference): void {
    preference.value = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage no disponible
    }
  }

  function toggleTheme(): void {
    setTheme(resolvedTheme.value === 'dark' ? 'light' : 'dark')
  }

  return { preference, resolvedTheme, setTheme, toggleTheme }
}
