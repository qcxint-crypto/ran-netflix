import type { Config } from 'tailwindcss'

// "Midnight cinema" palette: near-black base with a violet-blue cast, gold/amber
// accent for primary actions. Values live here as the single source of truth;
// globals.css mirrors the ones the shader/CSS layers need as custom properties
// (CSS cannot read the Tailwind config).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces, dark to light
        background: '#07070c',
        surface: '#0e0e16',
        'surface-hover': '#16161f',
        elevated: '#12121c',
        border: '#22222e',
        'border-strong': '#33333f',

        // Text ramp
        'text-primary': '#f4f4f7',
        'text-secondary': '#9a9aa8',
        'text-muted': '#6b6b7a',

        // Gold accent — primary CTAs, active states
        accent: '#e8b04b',
        'accent-hover': '#f5c463',
        'accent-dim': '#8a6a2c',
        gold: '#e8b04b',

        // Secondary accent for structural/detail emphasis
        violet: '#7c5cff',
        'violet-dim': '#3b2f6e',
        cyan: '#4fd1c5',
      },
      // Distinctive display serif for headings. A touch tighter than default.
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      transitionTimingFunction: {
        // Slight overshoot for hover lifts — makes cards feel physical.
        cinema: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Slow ambient drift for the fallback aurora (used when 3D is off).
        aurora: {
          '0%, 100%': { transform: 'translate3d(-4%, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -3%, 0) scale(1.08)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        aurora: 'aurora 24s ease-in-out infinite',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
