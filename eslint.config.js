
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "function", format: ["camelCase"] },
        { selector: "variable", format: ["camelCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
      ],
    },
  },
);
