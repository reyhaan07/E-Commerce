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
          light: '#3B82F6',
          DEFAULT: '#1D4ED8',
          dark: '#1E3A8A',
        },
        secondary: {
          light: '#F3F4F6',
          DEFAULT: '#E5E7EB',
          dark: '#374151',
        }
      },
    },
  },
  plugins: [],
}
