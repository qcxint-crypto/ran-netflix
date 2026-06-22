import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a1a',
        'surface-hover': '#242424',
        border: '#2a2a2a',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0a0',
        accent: '#e50914',
        'accent-hover': '#f40612',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
export default config
