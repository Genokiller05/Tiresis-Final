/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Dark Palette matching login
        "background-dark": "#081121", 
        "card-dark": "rgba(15, 32, 60, 0.8)", // Blue-tinted glass
        // Primary Blue/Indigo accents
        primary: "#2563eb", // Primary blue
        secondary: "#4338ca", // Royal Indigo
        "accent-purple": "#4f46e5", // Indigo accent
        "accent-blue": "#3b82f6", // Blue accent
        "glass-border": "rgba(59, 130, 246, 0.15)",
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
