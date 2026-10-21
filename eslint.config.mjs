import js from "@eslint/js";
import next from "@next/eslint-plugin-next";
import ts from "typescript-eslint";

const config = [
  { ignores: [".next/**", "node_modules/**", "out/**", "qa-artifacts/**", "next-env.d.ts"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  { plugins: { "@next/next": next } },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
    },
  },
];

export default config;
