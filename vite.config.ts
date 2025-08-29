import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: env.VITE_BASE_URL ?? "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@ui": path.resolve(__dirname, "./src/mod/features/ui"),
        "~": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "./src/mod/dist",
      sourcemap: true,
      minify: false,
      cssMinify: false,
      cssCodeSplit: false,
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "./src/mod/renderer.ts"),
        },
        output: {
          entryFileNames: "renderer.js",
          chunkFileNames: "[name].js",
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith(".css")) {
              return "renderer.css";
            }
            return "[name].[ext]";
          },
        },
      },
    },
  };
});
