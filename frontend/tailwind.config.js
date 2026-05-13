/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d0f14',
          secondary: '#161b26',
          tertiary: '#1e2535',
        },
        border: {
          DEFAULT: '#2a3045',
          light: '#1e2535',
        },
        accent: {
          DEFAULT: '#6c63ff',
          hover: '#5a52e0',
          muted: '#3d3780',
        },
        text: {
          primary: '#f0f4ff',
          secondary: '#c8d0e0',
          muted: '#8892a4',
          faint: '#606878',
        },
        success: '#5dbf7a',
        danger: '#e05555',
        warning: '#c8b050',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
