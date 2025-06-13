import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  publicDir: "public",
  server: {
    host: true,
  },
  resolve: {
    alias: {
      three: "three",
    },
  },
});
