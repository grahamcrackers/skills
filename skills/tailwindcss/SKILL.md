---
name: tailwindcss
description: Tailwind CSS v4 best practices including CSS-native configuration, theme variables, modern utilities, and migration patterns. Use when writing Tailwind CSS, styling components, configuring Tailwind, working with the v4 theme system, or when the user asks about Tailwind conventions or migration.
---

# Tailwind CSS v4 Best Practices

## CSS-Native Configuration

Tailwind v4 eliminates `tailwind.config.js`. All configuration lives in CSS using `@theme`:

```css
@import "tailwindcss";

@theme {
    --color-brand: #3b82f6;
    --color-brand-dark: #1d4ed8;
    --font-display: "Inter", sans-serif;
    --breakpoint-3xl: 1920px;
    --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

- Define custom design tokens in `@theme` — they become available as utilities automatically (`text-brand`, `font-display`, etc.).
- Override or extend the default theme using CSS custom properties — no JavaScript needed.
- Content detection is automatic — remove any manual `content` arrays.

## Setup

### Vite

```shell
npm install tailwindcss @tailwindcss/vite
```

```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [tailwindcss()],
});
```

### PostCSS

```shell
npm install tailwindcss @tailwindcss/postcss
```

```javascript
// postcss.config.js
export default {
    plugins: {
        "@tailwindcss/postcss": {},
    },
};
```

### CLI

```shell
npx @tailwindcss/cli -i input.css -o output.css
```

## Updated Utility Names

v4 renames several utilities to align with CSS specifications:

| v3 (deprecated)     | v4                     |
| ------------------- | ---------------------- |
| `bg-gradient-to-r`  | `bg-linear-to-r`       |
| `bg-gradient-to-b`  | `bg-linear-to-b`       |
| `flex-shrink-0`     | `shrink-0`             |
| `flex-grow`         | `grow`                 |
| `overflow-ellipsis` | `text-ellipsis`        |
| `decoration-clone`  | `box-decoration-clone` |
| `decoration-slice`  | `box-decoration-slice` |

The automated upgrade tool handles these: `npx @tailwindcss/upgrade`.

## New Utilities and Features

### Container Queries

First-class support without plugins:

```html
<div class="@container">
    <div class="flex flex-col @md:flex-row @lg:grid @lg:grid-cols-3">
        <!-- responsive to container, not viewport -->
    </div>
</div>
```

### 3D Transforms

```html
<div class="rotate-x-12 rotate-y-6 perspective-800">
    <!-- 3D spatial transforms -->
</div>
```

### Expanded Gradients

Radial and conic gradients with interpolation control:

```html
<div class="bg-radial from-blue-500 to-purple-500">...</div>
<div class="bg-conic from-red-500 via-yellow-500 to-red-500">...</div>
<div class="bg-linear-to-r from-blue-500 to-green-500 interpolate-hsl">...</div>
```

### Entry/Exit Animations

`@starting-style` support for CSS-only transitions without JavaScript:

```html
<div class="transition-opacity starting:opacity-0">
    <!-- animates in from opacity-0 -->
</div>
```

### `not-*` Variant

Inverse styling:

```html
<div class="not-last:mb-4">...</div>
<input class="not-disabled:hover:bg-blue-50" />
```

### Inferred Arbitrary Values

Use bare values without the bracket syntax for common utilities:

```html
<div class="grid-cols-15 mt-21 text-lg/9">...</div>
```

## Theme Variables

v4 exposes all theme values as CSS custom properties. Access them anywhere in your CSS:

```css
.custom-component {
    color: var(--color-brand);
    font-family: var(--font-display);
    padding: var(--spacing-4);
}
```

This makes Tailwind values available to non-Tailwind code, animations, and JavaScript without hardcoding values.

## Dark Mode

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

Use `dark:` variant as before: `bg-white dark:bg-gray-900`.

## Utility Patterns

### Spacing and Layout

- Use spacing scale consistently (`p-4`, `gap-6`, `mt-8`) — avoid arbitrary values unless the design requires a one-off value.
- Use `gap` on flex/grid containers instead of margin on children.
- Prefer `size-*` for square elements (`size-10` = `w-10 h-10`).

### Typography

- Use the `text-*` scale for font sizes.
- Set line-height with the slash syntax: `text-lg/7`.
- Use `tracking-*` for letter-spacing and `leading-*` for standalone line-height.

### Responsive Design

- Design mobile-first — base styles are mobile, use `sm:`, `md:`, `lg:` for larger breakpoints.
- Use container queries (`@container` / `@md:`) for component-level responsiveness.
- Prefer container queries over media queries for reusable components.

### Colors

- v4 uses a modernized P3 color palette for vivid displays.
- Use opacity modifiers: `bg-blue-500/50` for 50% opacity.
- Define semantic color tokens in `@theme` (`--color-primary`, `--color-danger`) rather than using raw palette colors directly.

## Class Organization

Order classes logically — layout, sizing, spacing, typography, visual, state:

```html
<div
    class="flex items-center gap-4 w-full p-4 text-sm font-medium text-gray-900 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
></div>
```

Use Prettier with `prettier-plugin-tailwindcss` to auto-sort classes consistently.

## Migration from v3

1. Run `npx @tailwindcss/upgrade` — handles ~90% of changes automatically.
2. Replace `tailwind.config.js` with `@theme` directives in your CSS.
3. Update PostCSS config to use `@tailwindcss/postcss` or switch to `@tailwindcss/vite`.
4. Replace deprecated class names (see updated utilities table above).
5. Remove manual `content` configuration — v4 detects sources automatically.

**Browser requirements**: Safari 16.4+, Chrome 111+, Firefox 128+.
