import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"]
  },
  {
    languageOptions:{
      globals: globals.browser
    }
  },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,

  {
    plugins: {
      "react-hooks": pluginReactHooks
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off"
    },
  },

  eslintConfigPrettier
];
