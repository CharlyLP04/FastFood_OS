/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E85D2F',
        secondary: '#DC2626',
        background: '#0A0A0B',
        'surface-dark': '#141416',
        'text-primary': '#FFFFFF',
        card: '#141416',
        'card-border': '#242428',
        muted: '#1C1C20',
        foreground: '#FFFFFF',
        'muted-foreground': '#A1A1AA',
        success: '#10B981',
        warning: '#F59E0B',
        destructive: '#EF4444',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 4px 12px rgba(0, 0, 0, 0.3)',
        md: '0 8px 24px rgba(0, 0, 0, 0.4)',
        lg: '0 16px 40px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        xl: '1rem',
      }
    },
  },
  plugins: [],
}
