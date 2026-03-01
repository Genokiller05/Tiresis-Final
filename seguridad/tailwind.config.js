/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Dark Palette
        "background-dark": "#020410", // Deep Midnight Blue
        "card-dark": "rgba(13, 17, 45, 0.6)", // Blue-tinted glass
        // Primary Purple/Blue accents
        primary: "#7c3aed", // Electric Purple
        secondary: "#3b82f6", // Royal Blue
        "accent-purple": "#a855f7",
        "accent-blue": "#60a5fa",
        "glass-border": "rgba(255, 255, 255, 0.1)",
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
