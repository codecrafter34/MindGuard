/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Trust Blue
          dark: '#1D4ED8',
          light: '#3B82F6',
        },
        secondary: {
          DEFAULT: '#14B8A6', // Healing Teal
          dark: '#0F766E',
          light: '#2DD4BF',
        },
        accent: {
          DEFAULT: '#22C55E', // Hope Green
          dark: '#15803D',
        },
        background: {
          light: '#F8FAFC',
          dark: '#0F172A',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E293B',
        },
        danger: {
          DEFAULT: '#EF4444',
          subtle: '#FEE2E2',
          darkSubtle: '#7F1D1D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          subtle: '#FEF3C7',
          darkSubtle: '#78350F',
        },
        success: {
          DEFAULT: '#10B981',
          subtle: '#D1FAE5',
          darkSubtle: '#064E3B',
        }
      },
      borderRadius: {
        '2xl': '1rem', // 16px
        '3xl': '1.5rem', // 24px
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.15)',
        'glass': 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
