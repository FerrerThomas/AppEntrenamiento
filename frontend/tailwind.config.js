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
          DEFAULT: '#CCFF00', // Neon Green
          dim: '#abd600',
        },
        surface: {
          0: '#0A0A0A', // Background
          1: '#1A1A1A', // Cards
          2: '#2C2C2E', // Modals/Overlays
        },
        error: '#ffb4ab',
        warning: '#ffb020',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '24px',
      },
      boxShadow: {
        'glow': '0px 4px 20px rgba(204, 255, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
