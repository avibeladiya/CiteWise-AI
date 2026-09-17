import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065' },
        accent: { 50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75', 950: '#4a044e' },
        surface: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' }
      },
      animation: {
        'fade-in':  'fadeIn .3s ease-out',
        'slide-up': 'slideUp .4s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer':  'shimmer 2.5s linear infinite',
        'dot':      'dot 1.4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        dot:     { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
        pulseGlow: { '0%, 100%': { opacity: '1', filter: 'blur(10px)' }, '50%': { opacity: '.5', filter: 'blur(20px)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } }
      },
      boxShadow: {
        soft:  '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
        card:  '0 8px 30px rgba(0,0,0,0.12)',
        brand: '0 8px 32px rgba(139, 92, 246, 0.35)',
        glow:  '0 0 40px rgba(139, 92, 246, 0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config
