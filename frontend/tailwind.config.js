/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0f172a',
          muted: '#64748b',
        },
        paper: '#f1f5f9',
        line: '#e2e8f0',
        accent: {
          DEFAULT: '#0f766e',
          hover: '#0d9488',
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
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        soft: '0 1px 2px rgba(15, 23, 42, 0.05)',
        lift: '0 10px 30px -12px rgba(15, 23, 42, 0.18)',
      },
      borderRadius: {
        panel: '0.75rem',
      },
    },
  },
  plugins: [],
};
