// filepath: eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
// import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import promisePlugin from "eslint-plugin-promise";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  js.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      import: importPlugin,
      promise: promisePlugin,
      sonarjs,
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
      eqeqeq: "warn",
      curly: "warn",
      "prefer-const": "warn",
      "no-var": "warn",
      "no-shadow": "warn",
      "no-use-before-define": "warn",

      "import/no-unresolved": "warn",
      "import/order": "warn",

      "promise/catch-or-return": "warn",
      "promise/no-return-wrap": "warn",

      // "@typescript-eslint/no-unnecessary-condition": "warn",
      // "@typescript-eslint/strict-boolean-expressions": "warn",
      // "@typescript-eslint/no-floating-promises": "warn",
      // "@typescript-eslint/no-unsafe-assignment": "warn",
      // "@typescript-eslint/no-unsafe-call": "warn",
      // "@typescript-eslint/no-unsafe-member-access": "warn",
      // "@typescript-eslint/no-unsafe-return": "warn",
      // "@typescript-eslint/no-unsafe-argument": "warn",
      // "@typescript-eslint/no-unused-vars": "warn",

      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/no-identical-functions": "warn",
      "sonarjs/cognitive-complexity": ["warn", 15],
    },
  },
];