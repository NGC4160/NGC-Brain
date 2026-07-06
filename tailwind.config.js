/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f8ec',
          100: '#e8f2d4',
          200: '#d0e5a9',
          300: '#b3d476',
          400: '#95c24a',
          500: '#6faa2d',
          600: '#5a9024',
          700: '#3d6b12',
          800: '#325610',
          900: '#2a470e',
        },
        ngc: {
          50: '#eef4f9',
          100: '#d9e6f2',
          200: '#b3cde5',
          300: '#7aa8cf',
          400: '#2d6ba3',
          500: '#1a4d7a',
          600: '#164066',
          700: '#123352',
          800: '#0e263d',
          900: '#0a1a29',
        },
      },
    },
  },
  plugins: [],
}
