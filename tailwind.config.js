/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{ts,tsx,js,jsx}', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#050D23',
        nebula: '#1B1443',
        glow: '#7F7CFF',
        aqua: '#00F5FF',
        lavender: '#A18CD1',
        blush: '#FBC2EB',
        spring: '#43E97B',
        mint: '#38F9D7',
        amber: '#FDD819',
        ruby: '#E80505',
      },
      fontFamily: {
        poppins: ['Poppins_400Regular', 'Poppins_500Medium', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0px 18px 28px rgba(10, 2, 50, 0.28)',
      },
    },
  },
  plugins: [],
};

