import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        spanish: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc8fa",
          400: "#38adf5",
          500: "#0e91e9",
          600: "#0274c7",
          700: "#025ca1",
          800: "#074f85",
          900: "#0c426e",
          950: "#082a49",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
