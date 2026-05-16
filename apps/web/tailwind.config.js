/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1A3C5E",
        action: "#0EA5E9",
        success: "#16A34A",
        amber: "#D97706",
        danger: "#DC2626",
        surface: "#FFFFFF",
        muted: "#6B7280",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 35%), linear-gradient(135deg, rgba(26,60,94,1), rgba(14,165,233,0.88))",
      },
    },
  },
  plugins: [],
};
