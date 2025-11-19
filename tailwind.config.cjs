module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyberbg: '#0d1117',
        neon: '#00bfb3',
        accent: '#69c0ba',
        elastic: {
          dark: '#0d1117',
          darker: '#010409',
          gray: '#161b22',
          teal: '#00bfb3',
          cyan: '#69c0ba',
          text: '#f0f2f5',
          muted: '#98a1b3'
        }
      }
    }
  },
  plugins: [],
}
