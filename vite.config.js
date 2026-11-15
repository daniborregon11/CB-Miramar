import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// base "./" para que funcione igual en GitHub Pages (subcarpeta /CB-Miramar/) y en local
export default defineConfig({
  base: "./",
  server: { host: true },
  preview: { host: true },
  plugins: [
    VitePWA({
      // "prompt": la versión nueva NO se activa sola; la app avisa y el usuario decide cuándo
      registerType: "prompt",
      injectRegister: false,
      includeManifestIcons: false, // ya los incluye globPatterns
      manifest: {
        id: "./",
        name: "CB Miramar · Estadísticas",
        short_name: "CB Miramar",
        description: "Estadísticas de baloncesto en directo desde la banda. Funciona sin conexión.",
        lang: "es",
        dir: "ltr",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "landscape",
        background_color: "#17191E",
        theme_color: "#17191E",
        categories: ["sports", "utilities"],
        icons: [
          { src: "icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icono-adaptable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Todo lo necesario para abrir sin conexión (las fuentes .woff antiguas no hacen falta: Chrome usa .woff2)
        globPatterns: ["**/*.{html,js,css,woff2,png,svg}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
