/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#81B64C',
        'primary-hover': '#a3c95e',
        accent: '#769656',
        highlight: '#BACA44',
        dark: '#1A1A1A',
        surface: '#262626',
        card: '#312E2B',
        border: '#3D3B38',
        'board-light': '#EEEED2',
        'board-dark': '#769656',
        'text-secondary': '#B0B0B0',
        'text-muted': '#888888',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      zIndex: {
        grain: '40',
        progress: '60',
        nav: '50',
        tooltip: '30',
        overlay: '20',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
