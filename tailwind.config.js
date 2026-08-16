/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#000000',
        card: '#0D0D0D',
        surface: '#151515',
        'surface-hover': '#1C1C1C',
        border: '#222222',
        'border-light': '#333333',
        primary: {
          DEFAULT: '#CCFF00',
          hover: '#b8e600',
          dark: '#1a2800',
          glow: 'rgba(204, 255, 0, 0.25)',
          subtle: 'rgba(204, 255, 0, 0.08)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8A8A8A',
          muted: '#555555',
        },
        status: {
          success: '#CCFF00',
          warning: '#FFB800',
          danger: '#FF3B30',
          info: '#00C7BE',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(204, 255, 0, 0.15)',
        'glow-md': '0 0 24px rgba(204, 255, 0, 0.25)',
        'glow-lg': '0 0 36px rgba(204, 255, 0, 0.35)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(204, 255, 0, 0.4))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 5px rgba(204, 255, 0, 0.1))' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
