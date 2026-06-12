import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#B5586A',
        accent:    '#C8956A',
        depth:     '#7A4E7A',
        njoum: {
          bg:        'var(--njoum-bg)',
          surface:   'var(--njoum-surface)',
          card:      'var(--njoum-card)',
          border:    'var(--njoum-border)',
          text:      'var(--njoum-text)',
          muted:     'var(--njoum-muted)',
          input:     'var(--njoum-input)',
          emergency: '#E53E3E',
          success:   '#38A169',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'njoum-gradient':  'linear-gradient(135deg, #B5586A, #7A4E7A)',
        'njoum-gradient-r':'linear-gradient(135deg, #7A4E7A, #B5586A)',
        'njoum-glow':      'radial-gradient(ellipse at 50% 0%, rgba(181,88,106,0.2) 0%, transparent 70%)',
      },
      animation: {
        'twinkle-a':    'twinkleA 3.2s ease-in-out infinite',
        'twinkle-b':    'twinkleB 4.1s ease-in-out infinite',
        'twinkle-c':    'twinkleC 2.8s ease-in-out infinite',
        'shooting':     'shooting 6s linear infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'slide-in-end': 'slideInEnd 0.3s cubic-bezier(0.4,0,0.2,1)',
        'fade-up':      'fadeUp 0.25s ease-out',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'float':        'float 5s ease-in-out infinite',
      },
      keyframes: {
        twinkleA: {
          '0%,100%': { opacity: '0.15', transform: 'scale(0.8)' },
          '50%':     { opacity: '1',    transform: 'scale(1.3)' },
        },
        twinkleB: {
          '0%,100%': { opacity: '0.3', transform: 'scale(1)' },
          '60%':     { opacity: '0.9', transform: 'scale(1.2)' },
        },
        twinkleC: {
          '0%,100%': { opacity: '0.1', transform: 'scale(0.9)' },
          '40%':     { opacity: '0.8', transform: 'scale(1.4)' },
        },
        shooting: {
          '0%':   { transform: 'translateX(0) translateY(0) rotate(-30deg)',  opacity: '0' },
          '5%':   { opacity: '1' },
          '25%':  { transform: 'translateX(-300px) translateY(150px) rotate(-30deg)', opacity: '0' },
          '100%': { transform: 'translateX(-300px) translateY(150px) rotate(-30deg)', opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        slideInEnd: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 8px rgba(181,88,106,0.3)'  },
          '50%':     { boxShadow: '0 0 22px rgba(181,88,106,0.7)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'njoum':     '0 4px 24px rgba(181,88,106,0.12)',
        'njoum-lg':  '0 8px 40px rgba(181,88,106,0.22)',
        'dark-card': '0 4px 32px rgba(0,0,0,0.45)',
        'glow':      '0 0 24px rgba(181,88,106,0.5)',
        'glow-sm':   '0 0 12px rgba(181,88,106,0.35)',
        'inner-glow':'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
