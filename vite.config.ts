import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Kniffel",
        short_name: "Kniffel",
        description: "Der Würfelklassiker für mehrere Spieler – offline spielbar, ganz ohne Server.",
        theme_color: "#5b3df0",
        background_color: "#1c1836",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        lang: "de",
        icons: [
          { src: "icons/icon-64.png", sizes: "64x64", type: "image/png" },
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
      },
    }),
  ],
});
