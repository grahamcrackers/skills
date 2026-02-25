---
name: vite
description: Vite configuration patterns for React and TypeScript projects including plugins, environment variables, proxy setup, build optimization, library mode, and SSR. Use when configuring Vite, setting up dev servers, optimizing builds, creating Vite plugins, or when the user asks about Vite configuration, HMR, or build tooling.
---

# Vite Configuration Patterns

## Basic Setup

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
});
```

Use `defineConfig` for type safety and IntelliSense.

## Conditional Configuration

```typescript
export default defineConfig(({ command, mode }) => {
    const isDev = command === "serve";
    const isProd = mode === "production";

    return {
        plugins: [react()],
        build: {
            sourcemap: isDev,
            minify: isProd ? "esbuild" : false,
        },
    };
});
```

- `command` is `"serve"` (dev) or `"build"` (production).
- `mode` is `"development"`, `"production"`, or custom.

## Path Aliases

```typescript
import { resolve } from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "@components": resolve(__dirname, "src/components"),
            "@lib": resolve(__dirname, "src/lib"),
        },
    },
});
```

Match aliases in `tsconfig.json`:

```jsonc
{
    "compilerOptions": {
        "paths": {
            "@/*": ["./src/*"],
            "@components/*": ["./src/components/*"],
            "@lib/*": ["./src/lib/*"],
        },
    },
}
```

## Environment Variables

Variables must be prefixed with `VITE_` to be exposed to client code:

```shell
# .env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App

# Not exposed to client (server-only)
DATABASE_URL=postgres://...
API_SECRET=secret
```

```typescript
// Access in code
const apiUrl = import.meta.env.VITE_API_URL;
const mode = import.meta.env.MODE; // "development" | "production"
const isDev = import.meta.env.DEV; // boolean
const isProd = import.meta.env.PROD; // boolean
```

### Type-Safe Env

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
```

### Env File Priority

```
.env                # loaded in all cases
.env.local          # loaded in all cases, gitignored
.env.[mode]         # loaded for specific mode
.env.[mode].local   # loaded for specific mode, gitignored
```

## Dev Server Proxy

Proxy API requests to a backend server:

```typescript
export default defineConfig({
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
            },
            "/api/v2": {
                target: "http://localhost:8081",
                rewrite: (path) => path.replace(/^\/api\/v2/, ""),
            },
            "/ws": {
                target: "ws://localhost:8080",
                ws: true,
            },
        },
    },
});
```

## Plugins

### Plugin Order

```typescript
export default defineConfig({
    plugins: [
        pluginA(), // default order
        pluginB({ enforce: "pre" }), // runs before Vite core
        pluginC({ enforce: "post" }), // runs after Vite build
    ],
});
```

### Conditional Plugins

```typescript
export default defineConfig(({ command }) => ({
    plugins: [
        react(),
        command === "build" && visualizer(), // only during build
        command === "serve" && inspector(), // only during dev
    ].filter(Boolean),
}));
```

### Common Plugins

| Plugin                     | Purpose                           |
| -------------------------- | --------------------------------- |
| `@vitejs/plugin-react`     | React Fast Refresh, JSX transform |
| `@tailwindcss/vite`        | Tailwind CSS v4 integration       |
| `vite-plugin-svgr`         | Import SVGs as React components   |
| `vite-plugin-pwa`          | Progressive Web App support       |
| `rollup-plugin-visualizer` | Bundle size visualization         |
| `vite-tsconfig-paths`      | Auto-resolve tsconfig paths       |

## Build Optimization

### Code Splitting

Vite splits code automatically at dynamic imports. Customize chunking:

```typescript
export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom"],
                    router: ["react-router"],
                    query: ["@tanstack/react-query"],
                },
            },
        },
    },
});
```

### Dynamic Manual Chunks

```typescript
manualChunks(id) {
  if (id.includes("node_modules")) {
    if (id.includes("react")) return "vendor";
    if (id.includes("@tanstack")) return "tanstack";
    return "deps";
  }
},
```

### Build Targets

```typescript
export default defineConfig({
    build: {
        target: "es2022", // modern browsers
        minify: "esbuild", // fast (default), or "terser" for smaller output
        cssMinify: "lightningcss", // faster CSS minification
        sourcemap: true, // enable for production debugging
        reportCompressedSize: false, // skip gzip size reporting (faster builds)
    },
});
```

### Chunk Size Warnings

```typescript
build: {
  chunkSizeWarningLimit: 500, // KB, default is 500
},
```

## Library Mode

Build a library for npm distribution:

```typescript
export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "MyLib",
            formats: ["es", "cjs"],
            fileName: (format) => `my-lib.${format}.js`,
        },
        rollupOptions: {
            external: ["react", "react-dom"],
            output: {
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                },
            },
        },
    },
});
```

For library bundling, consider tsdown instead — it handles DTS generation, multiple entries, and package.json exports more elegantly.

## CSS

### CSS Modules

```typescript
// Automatically enabled for *.module.css files
import styles from "./button.module.css";

// Configure behavior
export default defineConfig({
    css: {
        modules: {
            localsConvention: "camelCaseOnly",
            generateScopedName: "[name]__[local]___[hash:base64:5]",
        },
    },
});
```

### PostCSS

```typescript
export default defineConfig({
    css: {
        postcss: "./postcss.config.js",
    },
});
```

### Lightning CSS

```typescript
export default defineConfig({
    css: {
        transformer: "lightningcss",
        lightningcss: {
            targets: browserslistToTargets(browserslist(">= 0.25%")),
        },
    },
});
```

## Static Assets

```typescript
// Import as URL
import logo from "./logo.svg";

// Import as string
import shaderCode from "./shader.glsl?raw";

// Import as worker
import Worker from "./worker.js?worker";
```

### Public Directory

Files in `public/` are served at root and copied as-is to build output. Use for favicons, robots.txt, and files that must keep their exact filename.

## Preview

Preview production builds locally:

```shell
vite preview --port 4173
```

```typescript
export default defineConfig({
    preview: {
        port: 4173,
        strictPort: true,
    },
});
```

## Performance Tips

- **Dependency pre-bundling**: Vite pre-bundles `node_modules` with esbuild. Use `optimizeDeps.include` to pre-bundle deps that are dynamically imported.
- **Avoid barrel re-exports**: Barrel files (`index.ts` exporting everything) defeat tree-shaking in dev. Import directly when possible.
- **Use `reportCompressedSize: false`**: Disables gzip size computation for faster builds.
- **Split vendor chunks**: Separate stable vendor code from frequently changing app code.
