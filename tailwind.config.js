/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        crimson: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      // ACC-1b: text-slate-300..600 read central contrast tokens (src/index.css ACC-1 block),
      // so default contrast and the High contrast setting retune every screen at once.
      textColor: {
        slate: {
          300: 'rgb(var(--sgm-text-300) / <alpha-value>)',
          400: 'rgb(var(--sgm-text-400) / <alpha-value>)',
          500: 'rgb(var(--sgm-text-500) / <alpha-value>)',
          600: 'rgb(var(--sgm-text-600) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Theme kits own typefaces via --sgm-font-*; Cinzel/Inter remain Integration fallbacks.
        serif: ['var(--sgm-font-story)', 'Cinzel', 'serif'],
        sans: ['var(--sgm-font-ui)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
