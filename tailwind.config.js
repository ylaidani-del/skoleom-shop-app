/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#4bdd2c',
          'green-deep': '#22b222',
          yellow: '#dbea18',
          black: '#1a1a1a',
          blue: '#0d6efd',
        },
      },
    },
  },
  plugins: [],
};
