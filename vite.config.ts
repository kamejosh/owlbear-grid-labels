import { defineConfig } from "vite";
import { resolve } from "path";
import mkcert from "vite-plugin-mkcert";

declare var __dirname: string;
export default defineConfig({
    server: { host: "0.0.0.0", cors: true },
    assetsInclude: ["**/*.md"],
    plugins: [mkcert()],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
            },
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: "modern-compiler", // or "modern", "legacy"
            },
        },
    },
});
