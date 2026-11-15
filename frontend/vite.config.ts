import { defineConfig } from "vite";

// One ES module into custom_components/waipu_tv/frontend (not committed: the release workflow builds it
// into the release zip, scripts/dev and scripts/artwork build it locally).
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
