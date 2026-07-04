/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:        '#070d1a',
        secondary:      '#0d1526',
        accent:         '#6366f1',
        'accent-light': '#818cf8',
        cyan:           '#22d3ee',
        emerald:        '#34d399',
        rose:           '#fb7185',
        amber:          '#fbbf24',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow':    '0 0 32px rgba(99,102,241,0.15)',
        'glow-lg': '0 0 64px rgba(99,102,241,0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    // Scrollbar hide utility
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.text-balance': { 'text-wrap': 'balance' },
      })
    },
  ],
}
