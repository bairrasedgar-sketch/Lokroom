// apps/web/eslint.config.ts
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

export default [
  // Ignore de base (évite les erreurs sur build)
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**", "**/build/**"],
  },

  // Recommandations TypeScript (flat config officielle)
  ...tseslint.configs.recommended,

  // Règles projet (TS + React)
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      // On laisse parserOptions "simple" (project:false) pour éviter les erreurs de projet TS
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react },
    settings: { react: { version: "detect" } },
    rules: {
      // Next 13+ n'exige plus React importé
      "react/react-in-jsx-scope": "off",
      // Quelques réglages doux pour éviter trop de bruit
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
