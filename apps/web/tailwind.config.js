/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f5f7f4',
          100: '#e5ebe2',
          200: '#cbd7c5',
          300: '#a7bda0',
          400: '#7e9e75',
          500: '#5c8052',
          600: '#46663e',
          700: '#385132',
          800: '#2b3828',
          900: '#222d1d',
          950: '#131b10',
        },
        meadow: {
          50: '#fcfee8',
          100: '#f7fcc4',
          200: '#f0f98e',
          300: '#e5f356',
          400: '#d8ee88', // Highlight lime from GreenRoots
          500: '#bfe219',
          600: '#94b50d',
          700: '#718c0e',
          800: '#5a6e11',
          900: '#4c5d13',
          950: '#283405',
        },
        cream: {
          50: '#fcfdfa',
          100: '#f7faf2',
          200: '#f4f8de', // Pale cream-lime background
          300: '#ebf2cc',
          400: '#dbe7b2',
        },
        clay: {
          500: '#e05a3e', // Harvest terracotta accent
          600: '#c8442a',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

