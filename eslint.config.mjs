import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore plain JS scripts (no TypeScript rules apply)
    "scripts/**",
    // Ignore capacitor/android build artifacts
    "android/**",
    "gestion-cicd-kit/**",
  ]),
  // Project-wide rule overrides
  {
    rules: {
      // TypeScript: allow `any` as warn instead of error (gradual migration)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow require() in JS files
      "@typescript-eslint/no-require-imports": "warn",
      // Unused vars: keep as warn, not error
      "@typescript-eslint/no-unused-vars": "warn",
      // React unescaped entities: warn instead of error
      "react/no-unescaped-entities": "warn",
      // prefer-const: warn
      "prefer-const": "warn",
      // setState in effect: warn (legitimate use cases exist)
      "react-hooks/set-state-in-effect": "warn",
      // refs during render: warn
      "react-hooks/refs": "warn",
      // exhaustive-deps: warn
      "react-hooks/exhaustive-deps": "warn",
      // img element: warn
      "@next/next/no-img-element": "warn",
    },
  },
]);

export default eslintConfig;
