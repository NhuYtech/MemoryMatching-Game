/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          board: "hsl(var(--game-board))",
          "card-back": "hsl(var(--card-back))",
          "card-front": "hsl(var(--card-front))",
          "card-matched": "hsl(var(--card-matched))",
          "card-shadow": "hsl(var(--card-shadow))",
        },
      },
      keyframes: {
        "flip-in": {
          "0%": { transform: "rotateY(180deg)", opacity: "0" },
          "100%": { transform: "rotateY(0deg)", opacity: "1" },
        },
        "flip-out": {
          "0%": { transform: "rotateY(0deg)", opacity: "1" },
          "100%": { transform: "rotateY(180deg)", opacity: "0" },
        },
        "match-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: "0.8" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "flip-in": "flip-in 0.6s ease-out",
        "flip-out": "flip-out 0.6s ease-out",
        "match-pulse": "match-pulse 0.8s ease-in-out 2",
        "bounce-in": "bounce-in 0.6s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [], // Bỏ require("tailwindcss-animate")
}