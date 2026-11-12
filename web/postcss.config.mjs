// Tailwind CSS v4 runs through its own PostCSS plugin (no tailwind.config.js needed:
// design tokens live in src/styles/globals.css under @theme).
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
