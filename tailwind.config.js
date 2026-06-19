/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        // Один акцентный цвет + нейтральная палитра.
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#598bff',
          500: '#3366ff',
          600: '#1f4ae6',
          700: '#1839b4',
          800: '#193291',
          900: '#1a2f76',
        },
        warn: {
          50: '#fff8eb',
          100: '#ffedc7',
          300: '#fcd34d',
          500: '#f59e0b',
          700: '#b45309',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 8px 30px rgba(16,24,40,.08)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .28s ease-out both',
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
}
