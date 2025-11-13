// apps/web/.eslintrc.cjs
module.exports = {
  root: true,
  ignorePatterns: ["node_modules/", ".next/", "dist/"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "next/core-web-vitals",
  ],
  rules: {
    // On ne bloque pas sur `any`
    "@typescript-eslint/no-explicit-any": "warn",

    // Pour éviter les warnings sur <img> (tu pourras migrer vers next/image plus tard)
    "@next/next/no-img-element": "off",

    // Règles React obsolètes depuis la new JSX transform
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-react": "off",
  },
};
