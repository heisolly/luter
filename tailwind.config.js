/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        pixel: ['var(--font-geist-pixel)', 'monospace'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#98FF98',
          light: '#C4B5FD',
          dark: '#333333',
        },
        brand: {
          green: '#98FF98',
          yellow: '#FFF917',
          lavender: '#C4B5FD',
          white: '#F9FAFB',
          black: '#333333',
        },
        dark: '#333333',
      }
    },
  },
  plugins: [],
}
