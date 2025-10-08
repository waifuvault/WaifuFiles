// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import eslintJs from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const config = [
    { ignores: [".next/**"] },
    eslintJs.configs.recommended,
    ...tseslint.configs.recommended,
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
    },
    {
        rules: {
            curly: ["error", "all"],
        },
    },
];

export default config;
