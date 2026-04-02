/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        gold: { DEFAULT: '#C9A84C', light: '#E8C97A', pale: '#F5EDD9' },
        ink:  { DEFAULT: '#1A1A2E', soft: '#2D2D44' },
        slate: '#4A4A6A',
        mist:  '#F8F7F4',
      },
      backgroundOpacity: { '8': '0.08', '12': '0.12', '15': '0.15' },
    },
  },
  plugins: [],
}
