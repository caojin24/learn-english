/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        skysoft: "#d8efff",
        cream: "#fff7eb",
        peach: "#ffd7bf",
        mint: "#d9f6df",
        butter: "#fff0a8",
        ink: "#2b3955",
      },
      fontFamily: {
        display: ["Trebuchet MS", "Verdana", "sans-serif"],
        body: ["Arial", "Helvetica", "sans-serif"],
      },
      boxShadow: {
        bubble: "0 14px 30px rgba(79, 120, 176, 0.18)",
      },
      keyframes: {
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pop: {
          "0%": { transform: "scale(0.92)", opacity: "0.6" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        bounceSoft: "bounceSoft 1.6s ease-in-out infinite",
        pop: "pop 180ms ease-out",
      },
    },
  },
  plugins: [],
};
