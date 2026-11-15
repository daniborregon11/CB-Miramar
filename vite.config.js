import { defineConfig } from "vite";

// base "./" para que funcione igual en GitHub Pages (subcarpeta) y en local
export default defineConfig({
  base: "./",
  server: { host: true },
  preview: { host: true },
});
