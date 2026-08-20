/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  darkMode: 'class',
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
        app: {
          bg: 'var(--app-bg)',
          surface: 'var(--app-surface)',
          'surface-2': 'var(--app-surface-2)',
          fill: 'var(--app-fill)',
          fg: 'var(--app-fg)',
          'fg-2': 'var(--app-fg-2)',
          'fg-3': 'var(--app-fg-3)',
          border: 'var(--app-border)',
          'border-2': 'var(--app-border-2)',
          inv: 'var(--app-inv)',
          'inv-fg': 'var(--app-inv-fg)',
        },
      },
    },
  },
  plugins: [],
};
