import { crx } from "@crxjs/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import manifest from "./src/manifest.config";
import UnoCSS from '@unocss/svelte-scoped/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [UnoCSS(), svelte(), crx({ manifest })],
    publicDir: "./src/public",
    // HACK: https://github.com/crxjs/chrome-extension-tools/issues/696
    // https://github.com/crxjs/chrome-extension-tools/issues/746
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            clientPort: 5173,
        },
    },
});
