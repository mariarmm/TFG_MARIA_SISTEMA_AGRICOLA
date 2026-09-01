import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export default defineConfig({
    testDir: "./pruebas/sistema",

    use: {
        baseURL: "http://localhost:5173",
        headless: true,
    },

    webServer: {
        command: "pnpm dev",
        url: "http://localhost:5173",
        reuseExistingServer: true,
    },
});