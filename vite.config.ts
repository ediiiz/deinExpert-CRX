import { crx } from "@crxjs/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import manifest from "./src/manifest.config";
import UnoCSS from '@unocss/svelte-scoped/vite'
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";


// https://vitejs.dev/config/
export default defineConfig( ({ mode }) => {

    const isProduction = mode === 'production';
    
    return {
    plugins: [UnoCSS(), svelte({ emitCss: false }), crx({ manifest }), obfuscatorPlugin({
        include: ["src/**/*.ts", "src/**/*.js, src/**/*.svelte"],
        apply: "build",
        debugger: true,
        options: {
            optionsPreset: "high-obfuscation",
        }
    })],
    build: {
        outDir: isProduction ? "build" : "dev-build",
        emptyOutDir: true,
        minify: isProduction ? "terser" : false,
        terserOptions: {
            compress: {
                drop_console: true,
            },
            mangle: true,
        },
    },
    publicDir: "./src/public",
    // HACK: https://github.com/crxjs/chrome-extension-tools/issues/696
    // https://github.com/crxjs/chrome-extension-tools/issues/746
    server: {
        port: 5174,
        strictPort: true,
        hmr: {
            clientPort: 5174,
        },
    },
}});
