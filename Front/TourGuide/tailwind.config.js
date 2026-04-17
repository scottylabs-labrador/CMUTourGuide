/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cmu: {
          red: '#C41E3A',
        },
        card: '#F1F3F5',
        border: '#e9ecef',
        muted: '#999',
        subtle: '#bbb',
        danger: '#dc3545',
      },
      fontFamily: {
        serif: ['SourceSerifPro_400Regular'],
        'serif-semi': ['SourceSerifPro_600SemiBold'],
        'serif-bold': ['SourceSerifPro_700Bold'],
      },
    },
  },
  plugins: [],
}
