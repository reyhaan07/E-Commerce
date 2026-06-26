/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#93c5fd',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        secondary: {
          light: '#f8fafc',
          DEFAULT: '#e2e8f0',
          dark: '#334155',
        }
      },
    },
  },
  plugins: [],
}
