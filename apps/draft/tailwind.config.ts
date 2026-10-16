import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000',
      white: '#fff',
      surface: 'rgb(var(--surface) / <alpha-value>)',
      raised: 'rgb(var(--raised) / <alpha-value>)',
      overlay: 'rgb(var(--overlay) / <alpha-value>)',
      line: 'rgb(var(--line) / <alpha-value>)',
      'line-soft': 'rgb(var(--line-soft) / <alpha-value>)',
      ink: 'rgb(var(--ink) / <alpha-value>)',
      muted: 'rgb(var(--muted) / <alpha-value>)',
      faint: 'rgb(var(--faint) / <alpha-value>)',
      accent: {
        DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
        hover: 'rgb(var(--accent-hover) / <alpha-value>)',
        subtle: 'rgb(var(--accent-subtle) / <alpha-value>)',
        ink: 'rgb(var(--accent-ink) / <alpha-value>)',
      },
      danger: 'rgb(var(--danger) / <alpha-value>)',
    },
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        md: '6px',
        lg: '10px',
        xl: '14px',
      },
      boxShadow: {
        elev1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        elev2:
          '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 4px 12px -2px rgb(0 0 0 / 0.08)',
        elev3:
          '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 12px 28px -6px rgb(0 0 0 / 0.14)',
        page: '0 0 0 1px rgb(0 0 0 / 0.04), 0 2px 6px rgb(0 0 0 / 0.06), 0 16px 40px -12px rgb(0 0 0 / 0.22)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '250ms',
      },
      keyframes: {
        'menu-in': {
          from: { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'menu-in': 'menu-in 150ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
