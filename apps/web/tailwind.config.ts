import type { Config } from 'tailwindcss';

const config: Config = {
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
          bg:      '#FDF6F0',
          text:    '#2A1520',
          muted:   '#8A6070',
          border:  '#E8D5D0',
          surface: '#FFFFFF',
          emergency: '#E53E3E',
          success:   '#38A169',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
