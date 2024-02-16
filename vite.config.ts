import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    optimizeDeps: {
        include: ["@logto/browser"],
    },
    build: {
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
    server: {
        port: 3000,
    },
});