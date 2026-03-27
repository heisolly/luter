/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif', '"Plus Jakarta Sans"'],
        serif: ['Besley', 'Georgia', 'serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#9718fb',
          light: '#b04dfc',
          dark: '#7a12cc',
        },
        dark: '#0B0A10',
      }
    },
  },
  plugins: [],
}
