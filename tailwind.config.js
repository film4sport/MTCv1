/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'mono-green': {
          50: '#f7faf0',
          100: '#ecf4dd',
          200: '#dceabf',
          300: '#c4db96',
          400: '#a8c76b',
          500: '#8bb44a',
          600: '#6b9a36',
          700: '#547a2c',
          800: '#456128',
          900: '#3b5225',
        }
      }
    },
  },
  plugins: [],
}
