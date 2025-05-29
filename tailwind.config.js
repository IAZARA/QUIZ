/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'border-color': 'var(--color-border)',
        'accent': 'var(--color-accent)',
        'button-text': 'var(--color-button-text)',
      },
      blue: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c3daff',
        300: '#a7bcff',
        400: '#8b9dff',
        500: '#6f80ff',
        600: '#5363ff',
        700: '#3746ff',
        800: '#1b29ff',
        900: '#000cff',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
        'shine': 'shine 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};