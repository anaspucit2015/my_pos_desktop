/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy blue — kept for any remaining usages
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },

        // ── Semantic surface tokens ───────────────────────────────
        // Values are CSS variables; see globals.css for light/dark definitions.
        surface: {
          DEFAULT: 'var(--surface)',      // main page background
          nav:     'var(--surface-nav)',  // sidebar background
          card:    'var(--surface-card)', // card / panel fill
          hover:   'var(--surface-hover)', // interactive hover fill
        },

        // ── Accent (teal) ─────────────────────────────────────────
        accent: {
          DEFAULT: 'var(--accent)',    // #5DCAA5 in both themes
          fg:      'var(--accent-fg)', // foreground on accent bg
        },

        // ── Text hierarchy ────────────────────────────────────────
        t1: 'var(--t1)', // primary text
        t2: 'var(--t2)', // secondary / subdued text
        t3: 'var(--t3)', // placeholder / muted text

        // ── Border tokens ─────────────────────────────────────────
        line: {
          DEFAULT: 'var(--line)',        // subtle border
          strong:  'var(--line-strong)', // stronger border (e.g. dividers)
        },
      },

      borderRadius: {
        card:  '14px',
        input: '10px',
        pill:  '20px',
      },
    },
  },
  plugins: [],
};
