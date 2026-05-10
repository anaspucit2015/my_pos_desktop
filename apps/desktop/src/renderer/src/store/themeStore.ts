import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pos-theme';

/** Applies or removes the `dark` class on <html> to activate the CSS variable set. */
function applyThemeClass(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

interface IThemeStore {
  theme: Theme;

  /**
   * Read the saved preference from localStorage; fall back to the OS
   * `prefers-color-scheme` media query on first launch.
   * Must be called once on app mount (before any render that depends on theme).
   */
  initTheme(): void;

  /** Set a specific theme, persist it, and apply it to the DOM. */
  setTheme(theme: Theme): void;

  /** Toggle between light and dark. */
  toggleTheme(): void;
}

export const useThemeStore = create<IThemeStore>((set, get) => ({
  theme: 'dark',

  initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;

    if (saved === 'light' || saved === 'dark') {
      set({ theme: saved });
      applyThemeClass(saved);
      return;
    }

    // First launch — honour OS preference, default to dark if unavailable
    const prefersDark =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true;
    const initial: Theme = prefersDark ? 'dark' : 'light';
    set({ theme: initial });
    applyThemeClass(initial);
    localStorage.setItem(STORAGE_KEY, initial);
  },

  setTheme(theme) {
    set({ theme });
    applyThemeClass(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  },

  toggleTheme() {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
