import { useThemeStore } from '../store/themeStore';
import type { Theme } from '../store/themeStore';

interface UseThemeResult {
  theme: Theme;
  isDark: boolean;
  toggleTheme(): void;
  setTheme(theme: Theme): void;
}

/**
 * Convenience hook — thin wrapper over `useThemeStore`.
 * Returns the active theme and actions to change it.
 */
export function useTheme(): UseThemeResult {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  return { theme, isDark: theme === 'dark', toggleTheme, setTheme };
}
