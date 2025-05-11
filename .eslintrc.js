module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-explicit-any": ["error", {
      "ignoreRestArgs": true,
      "fixToUnknown": false
    }],
    "quotes": ["error", "double", { "avoidEscape": true }],
    "no-multiple-empty-lines": ["error", { "max": 1 }],
    "no-trailing-spaces": "error",
    "eol-last": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "no-console": "off",
    "prefer-const": "error",
    "eqeqeq": ["error", "always"],
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
};