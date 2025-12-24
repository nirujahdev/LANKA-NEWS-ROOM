/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
      },
      colors: {
        primary: {
          blue: '#2563EB',
          'accent-blue': '#3B82F6',
          'blue-glow': 'rgba(37, 99, 235, 0.3)',
        },
        google: {
          blue: '#1A73E8',
          gray: '#5F6368',
          dark: '#202124',
          bg: '#F5F5F5',
          border: '#E8EAED',
        },
        text: {
          dark: '#0F172A',
          gray: '#64748B',
        },
        card: {
          ash: '#F1F5F9',
        },
        border: {
          gray: '#E5E7EB',
        },
      },
      boxShadow: {
        'glow': '0 0 8px rgba(37, 99, 235, 0.4)',
        'glow-soft': '0 0 12px rgba(37, 99, 235, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

