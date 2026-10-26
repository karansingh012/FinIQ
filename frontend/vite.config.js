import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks: { charts: ["recharts"], vendor: ["react", "react-dom", "react-router-dom"] } } } },
  server: {
    proxy: { "/api": process.env.API_PROXY_TARGET || "http://localhost:8080" },
  },
  test: { environment: "jsdom", setupFiles: "./src/test-setup.js" },
});
