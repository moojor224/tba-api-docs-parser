import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/page.ts"],
    format: ["esm"],
    dts: false, // Generate declaration file (.d.ts)
    splitting: false,
    sourcemap: false,
    clean: true,
    outDir: "tsup-out"
});
