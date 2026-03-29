import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/components": resolve(__dirname, "components"),
      "@/app": resolve(__dirname, "app"),
      "@/lib": resolve(__dirname, "lib"),
      "@/domain": resolve(__dirname, "src/domain"),
      "@/application": resolve(__dirname, "src/application"),
      "@/infrastructure": resolve(__dirname, "src/infrastructure"),
      "@/shared": resolve(__dirname, "src/shared"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
