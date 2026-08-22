import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Next.js 16 の設定で追加されたReact Compiler向けルール。
      // 既存実装のリファクタリングは移行タスクに混ぜず、別タスクで扱う。
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    ".netlify/**",
    ".claude/**",
    ".cursor/**",
    "node_modules/**",
    "public/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
