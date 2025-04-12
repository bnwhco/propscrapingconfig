// vite.config.ts (Updated for vite-plugin-web-extension v4+)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from "vite-plugin-web-extension";
import path from "path";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    // Node polyfills (still potentially needed for Amplify)
    nodePolyfills({
        globals: {
            Buffer: true,
            global: true,
            process: true,
        },
        protocolImports: true,
    }),
    // Configure the web extension plugin
    webExtension({
      // Manifest path - points to your source manifest in public/
      // The plugin reads this to determine entry points.
      manifest: "public/manifest.json",

      // Additional options if needed (defaults are often sufficient):
      // disableAutoLaunch: true,
      // skipManifestValidation: false,
      // printSummary: true,
    }),
  ],
  resolve: {
    // Alias configuration (remains the same)
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // './runtimeConfig': './runtimeConfig.browser', // Example Amplify workaround
    },
  },
  // Build options:
  build: {
    // You might still need rollupOptions for non-extension specific outputs
    // or advanced configurations, but remove explicit inputs for extension assets.
    rollupOptions: {
      // --- REMOVE Explicit Inputs for extension assets ---
      // Remove lines like these if they existed previously,
      // as the plugin handles them based on manifest.json:
      // input: {
      //   sidepanel: path.resolve(__dirname, 'public/sidepanel.html'),
      //   background: path.resolve(__dirname, 'src/background.ts'),
      //   popup: path.resolve(__dirname, 'public/popup.html'),
      // },

      // Keep other Rollup customizations if needed
      output: {
        // Example: Control output naming if necessary, though defaults usually work
        // entryFileNames: `assets/[name].js`,
        // chunkFileNames: `assets/[name].js`,
        // assetFileNames: `assets/[name].[ext]`
      }
    },
    // Set the output directory (default is 'dist', usually fine)
    // outDir: 'dist',
    // Enable sourcemaps if desired for debugging the built extension
    // sourcemap: true,
  },
  // Optional server config (remains the same)
  // server: {
  //   port: 3000,
  // }
});