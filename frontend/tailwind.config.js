/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#f7f0ff',
          100: '#efe6ff',
          200: '#d8c6ff',
          500: '#7b3df0',
          600: '#6428d1',
          700: '#4b1d7a',
          900: '#2a0f4c'
        }
      },
      boxShadow: {
        luxe: '0 30px 60px rgba(41, 15, 76, 0.18)'
      }
    },
  },
  plugins: [],
}

