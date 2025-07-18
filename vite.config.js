import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ['@arcgis/core']
  },
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
    target: "es2023",
  },
  server: {
    open: true,
  },
});
