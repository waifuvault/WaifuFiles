// @ts-check
import tseslint from "typescript-eslint";
import eslintJs from "@eslint/js";

const config = [
    { ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"] },
    eslintJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            curly: ["error", "all"],
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
];

export default config;
