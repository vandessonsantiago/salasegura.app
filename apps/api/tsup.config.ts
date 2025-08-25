import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/**/*.ts", "!src/generated/**", "!src/**/*.test.ts", "!src/__tests__/**"],
  clean: true,
  format: ["cjs"],
  ...options,
}));
