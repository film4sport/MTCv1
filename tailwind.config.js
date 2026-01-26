/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'mono-green': {
          50: '#f4f7ed',
          100: '#e6ecd8',
          200: '#ced9b5',
          300: '#afc088',
          400: '#91a662',
          500: '#6b7a3d',
          600: '#576432',
          700: '#434d28',
          800: '#383f24',
          900: '#313723',
        }
      }
    },
  },
  plugins: [],
}
