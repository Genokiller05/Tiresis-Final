/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Navy blue background from reference
        "background-dark": "#0f172a", // Slate-900 like
        "background-light": "#f1f5f9", // Slate-100
        // Primary gold accent for button
        primary: "#D4AF37", // Gold
        "primary-hover": "#b5952f",
        // Secondary accents
        "accent-blue": "#3b82f6", // Bright blue for inputs/text
        "navy-card": "#1e293b",
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
