import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * 現時点で必要なのは純粋な関数のテストだけなので、
 * jsdom もコンポーネントの描画テストも用意していない。
 * 必要になった時点で足すこと。
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
