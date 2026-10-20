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
        brand: {
          DEFAULT: '#15432a',
          hover: '#1d5a38',
          soft: '#eef5f0',
          muted: '#b9d4c2',
        },
        wheat: {
          DEFAULT: '#eab308',
          hover: '#ca9a06',
          soft: '#fef8e1',
          ink: '#7a5a04',
        },
        charcoal: {
          DEFAULT: '#191c1a',
          muted: '#59615b',
        },
        canvas: '#f8faf6',
        sand: '#f0f4ee',
        hairline: '#dfe5dc',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        shell: '80rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 35, 51, 0.05)',
        soft: '0 1px 2px rgba(31, 29, 36, 0.06)',
        lift: '0 14px 30px -18px rgba(31, 29, 36, 0.35)',
      },
    },
  },
  plugins: [],
};
