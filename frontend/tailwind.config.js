/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:   '#112a29',
          mid:    '#167862',
          light:  '#ddf05c',
          accent: '#e0ef75',
          cream:  '#f7f4ed',
          border: '#d9d4c8',
        },
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        mono:  ['DM Mono', 'monospace'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
