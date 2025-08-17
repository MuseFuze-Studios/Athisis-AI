/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          850: '#1f2937',
          950: '#0a0a0a',
        },
        blue: {
          450: '#5b9bd5',
          550: '#3b82f6',
        },
        green: {
          450: '#10b981',
        },
        amber: {
          450: '#f59e0b',
        },
        red: {
          450: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      },
      animation: {
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};