/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#faf7f2',
          100: '#f0e9dc',
          200: '#e2d3b8',
          300: '#d1b88e',
          400: '#c4a06c',
          500: '#b68a52',
          600: '#a47346',
          700: '#885a3b',
          800: '#6f4a35',
          900: '#5c3e2e',
        },
        surface: {
          0:   '#ffffff',
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
