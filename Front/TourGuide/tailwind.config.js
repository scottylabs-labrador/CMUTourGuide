/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // CMU Brand core palette
        cmu: {
          red: '#C41230',     // Carnegie Red
        },
        iron: '#6D6E71',      // Iron Gray
        steel: '#E0E0E0',     // Steel Gray
        // Aliases used throughout the app
        card: '#E0E0E0',      // Steel Gray
        border: '#E0E0E0',    // Steel Gray
        muted: '#6D6E71',     // Iron Gray
        subtle: '#6D6E71',    // Iron Gray
        danger: '#dc3545',
      },
      fontFamily: {
        // Source Serif Pro — display / brand
        serif: ['SourceSerifPro_400Regular'],
        'serif-semi': ['SourceSerifPro_600SemiBold'],
        'serif-bold': ['SourceSerifPro_700Bold'],
        // Open Sans — body / UI
        sans: ['OpenSans_400Regular'],
        'sans-semi': ['OpenSans_600SemiBold'],
        'sans-bold': ['OpenSans_700Bold'],
      },
    },
  },
  plugins: [],
}
