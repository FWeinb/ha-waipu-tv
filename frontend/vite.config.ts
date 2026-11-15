import { defineConfig } from "vite";

// One ES module, committed to custom_components/waipu_tv/frontend so Marketplace users need no build.
export default defineConfig({
  build: {
    lib: {
      entry: "src/waipu-tv-panel.ts",
      formats: ["es"],
      fileName: () => "waipu-tv-panel.js",
    },
    outDir: "../custom_components/waipu_tv/frontend",
    emptyOutDir: true,
    target: "es2022",
  },
});
