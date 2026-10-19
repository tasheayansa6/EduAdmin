/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#142333',
          muted: '#4d5d6e',
        },
        paper: '#eef2f5',
        line: '#d9e1e8',
        accent: {
          DEFAULT: '#0f766e',
          hover: '#115e59',
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 35, 51, 0.05)',
      },
    },
  },
  plugins: [],
};
