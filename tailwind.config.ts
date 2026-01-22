import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f9f8',
          100: '#ccf3f1',
          200: '#99e7e3',
          300: '#66dbd5',
          400: '#33cfca',
          500: '#1dadce',
          600: '#178aa3',
          700: '#116779',
          800: '#0b444f',
          900: '#062226',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'glass-dark': 'linear-gradient(135deg, rgba(29, 173, 206, 0.15), rgba(29, 173, 206, 0.05))',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
        'glass-hover': '0 8px 32px 0 rgba(29, 173, 206, 0.15)',
        'neon': '0 0 20px rgba(29, 173, 206, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
