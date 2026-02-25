---
name: eslint-9
description: ESLint 9 flat config patterns for JavaScript and TypeScript projects. Covers migration from .eslintrc, defineConfig, TypeScript config files, plugin setup, and common rule configurations. Use when setting up ESLint, migrating to flat config, configuring linting rules, or when the user asks about ESLint configuration or code quality tooling.
---

# ESLint 9 Flat Config Patterns

## Overview

ESLint 9 uses **flat config** (`eslint.config.js`) as the default. The legacy `.eslintrc.*` format is deprecated.

Key differences from `.eslintrc`:

- Single config file, explicit imports — no magic `extends` strings.
- Config is an exported array of config objects, applied in order.
- Plugins are imported directly, not referenced by string name.
- Glob patterns in `files` replace the old `overrides` system.

## Basic Setup

### JavaScript

```javascript
// eslint.config.js
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        rules: {
            "no-unused-vars": "warn",
            "no-console": "warn",
        },
    },
];
```

### TypeScript

```shell
npm install -D eslint @eslint/js typescript-eslint
```

```typescript
// eslint.config.ts
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(js.configs.recommended, tseslint.configs.recommended, {
    rules: {
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
});
```

`typescript-eslint` exports a `config()` helper that provides type safety and handles array flattening.

### TypeScript Config Files

ESLint 9 supports `eslint.config.ts` natively — no extra packages needed. Use it for full type checking of your config:

```typescript
import type { Linter } from "eslint";
```

## `defineConfig`

ESLint provides `defineConfig` for type-safe configs without `typescript-eslint`:

```javascript
import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
    js.configs.recommended,
    {
        files: ["**/*.js"],
        rules: {
            "no-console": "warn",
        },
    },
]);
```

`defineConfig` auto-flattens nested arrays and provides IntelliSense for rule names.

## Adding Plugins

Plugins are imported and assigned to a namespace:

```typescript
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(js.configs.recommended, tseslint.configs.recommended, {
    files: ["**/*.{tsx,jsx}"],
    plugins: {
        react: reactPlugin,
        "react-hooks": reactHooksPlugin,
    },
    rules: {
        "react/jsx-no-target-blank": "error",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
    },
    settings: {
        react: { version: "detect" },
    },
});
```

Many plugins now ship flat config presets. Check for `plugin.configs["flat/recommended"]` or similar exports.

## Global Ignores

Use a config object with only `ignores` (no `files`) for global ignore patterns:

```typescript
export default tseslint.config(
    { ignores: ["dist/", "node_modules/", "*.config.*", ".next/"] },
    js.configs.recommended,
    tseslint.configs.recommended,
);
```

Global ignores must be a **standalone object** — not combined with `rules` or `files`.

## File-Specific Overrides

Use `files` globs to scope rules:

```typescript
export default tseslint.config(
    js.configs.recommended,
    tseslint.configs.recommended,

    // Stricter rules for source code
    {
        files: ["src/**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-explicit-any": "error",
        },
    },

    // Relaxed rules for tests
    {
        files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },

    // Config files (CommonJS)
    {
        files: ["*.config.{js,cjs,mjs}"],
        languageOptions: {
            sourceType: "commonjs",
        },
    },
);
```

## Prettier Integration

Use `eslint-config-prettier` to disable formatting rules that conflict with Prettier:

```typescript
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
    js.configs.recommended,
    tseslint.configs.recommended,
    prettierConfig, // must be last to override formatting rules
);
```

Don't use `eslint-plugin-prettier` — let Prettier handle formatting separately.

## Common React + TypeScript Config

A complete config for a React + TypeScript project:

```typescript
// eslint.config.ts
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
    { ignores: ["dist/", "node_modules/", ".next/"] },

    js.configs.recommended,
    tseslint.configs.recommended,

    {
        files: ["**/*.{tsx,jsx}"],
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooksPlugin,
        },
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
        },
        settings: {
            react: { version: "detect" },
        },
    },

    {
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
        },
    },

    prettierConfig,
);
```

## Migration from `.eslintrc`

1. Run the migration tool: `npx @eslint/migrate-config .eslintrc.json`
2. Review the generated `eslint.config.mjs` — the tool handles most conversions.
3. Replace string-based plugin references with direct imports.
4. Replace `extends` strings with imported config arrays.
5. Convert `overrides` to separate config objects with `files` globs.
6. Delete `.eslintrc.*` and `.eslintignore` files.

## Debugging

Inspect the resolved config for any file:

```shell
npx eslint --inspect-config
```

This launches an interactive viewer showing which rules apply to each file and where they come from.
