import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['attribute', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'bg-base':      'var(--bg-base)',
        'bg-surface':   'var(--bg-surface)',
        'bg-surface-2': 'var(--bg-surface-2)',
        'bg-surface-3': 'var(--bg-surface-3)',
        accent:         'var(--accent)',
        'accent-light': 'var(--accent-light)',
        gold:           'var(--gold)',
        'gold-light':   'var(--gold-light)',
        success:        'var(--success)',
        danger:         'var(--danger)',
        warn:           'var(--warn)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        gold: 'var(--shadow-gold)',
        card: 'var(--shadow-md)',
      },
      animation: {
        'fade-in':  'fadeIn var(--dur-base) var(--ease-smooth)',
        'slide-up': 'slideUp var(--dur-slow) var(--ease-spring)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}

export default config
