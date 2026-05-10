import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

/**
 * Icon button that toggles between light and dark themes.
 * Shows a Sun in dark mode (click to go light) and Moon in light mode (click to go dark).
 */
export default function ThemeToggle(): React.JSX.Element {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-input text-t2
                 hover:bg-surface-hover hover:text-t1 transition-colors"
    >
      {isDark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
    </button>
  );
}
