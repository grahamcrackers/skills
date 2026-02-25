---
name: modern-css
description: Modern CSS features and patterns including cascade layers, container queries, :has(), @scope, view transitions, anchor positioning, nesting, and scroll-driven animations. Use when writing modern CSS, choosing between CSS approaches, or when the user asks about new CSS features, cascade layers, container queries, or CSS architecture.
---

# Modern CSS Patterns

## CSS Nesting

Native CSS nesting, no preprocessor required:

```css
.card {
    padding: 1rem;
    background: white;

    & .title {
        font-size: 1.25rem;
        font-weight: 600;
    }

    &:hover {
        box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
    }

    @media (width >= 768px) {
        padding: 2rem;
    }
}
```

- `&` references the parent selector (required for pseudo-classes and combinators).
- Media queries can be nested directly inside rules.
- Don't nest more than 3 levels deep — it becomes hard to read and produces overly specific selectors.

## Cascade Layers

Control specificity ordering explicitly with `@layer`:

```css
@layer reset, base, components, utilities;

@layer reset {
    *,
    *::before,
    *::after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
}

@layer base {
    body {
        font-family: system-ui, sans-serif;
        line-height: 1.5;
    }

    a {
        color: var(--color-link);
    }
}

@layer components {
    .button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
    }
}

@layer utilities {
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
    }
}
```

Layer order determines priority — later layers win over earlier ones regardless of selector specificity. Unlayered styles always beat layered styles.

## Container Queries

Style elements based on their container's size, not the viewport:

```css
.card-grid {
    container-type: inline-size;
    container-name: card-grid;
}

@container card-grid (width >= 600px) {
    .card {
        display: grid;
        grid-template-columns: 200px 1fr;
    }
}

@container card-grid (width >= 900px) {
    .card {
        grid-template-columns: 300px 1fr;
    }
}
```

- `container-type: inline-size` enables width-based queries.
- Use container queries for reusable components that must adapt to their context, not just the viewport.
- Pair with Tailwind v4's `@container` and `@md:` syntax for utility-class container queries.

### Container Style Queries

Query a container's custom property values:

```css
.theme-wrapper {
    container-type: normal;
    --theme: light;
}

@container style(--theme: dark) {
    .card {
        background: #1a1a1a;
        color: white;
    }
}
```

## `:has()` Selector

The parent selector CSS never had — select elements based on their descendants or siblings:

```css
/* Card with an image gets different layout */
.card:has(img) {
    grid-template-rows: 200px 1fr;
}

/* Form group with invalid input shows error styling */
.form-group:has(:invalid) {
    border-color: var(--color-error);
}

/* Navigation with many items switches to hamburger */
nav:has(> :nth-child(6)) {
    .nav-list {
        display: none;
    }
    .hamburger {
        display: block;
    }
}

/* Style previous siblings */
li:has(+ li:hover) {
    opacity: 0.7;
}
```

`:has()` is supported in all modern browsers. Use it to replace JavaScript-driven parent styling.

## `@scope`

Scope styles with upper and lower bounds:

```css
@scope (.card) to (.card-footer) {
    p {
        color: var(--color-muted);
    }

    a {
        color: var(--color-link);
    }
}
```

- Styles apply within `.card` but stop at `.card-footer`.
- Proximity wins — closer scopes override farther ones (unlike specificity).
- Useful for component-scoped styles without CSS Modules or BEM.

## View Transitions

### Same-Document (SPA)

```typescript
function navigate(url: string) {
    if (!document.startViewTransition) {
        updateDOM(url);
        return;
    }

    document.startViewTransition(() => {
        updateDOM(url);
    });
}
```

```css
::view-transition-old(root) {
    animation: fade-out 0.2s ease-out;
}

::view-transition-new(root) {
    animation: fade-in 0.3s ease-in;
}
```

### Cross-Document (MPA)

```css
@view-transition {
    navigation: auto;
}
```

### Named Transitions

Animate specific elements between pages:

```css
.hero-image {
    view-transition-name: hero;
}

::view-transition-old(hero) {
    animation: shrink 0.3s ease-out;
}

::view-transition-new(hero) {
    animation: grow 0.3s ease-in;
}
```

Each `view-transition-name` must be unique on the page.

## Anchor Positioning

Position elements relative to an anchor without JavaScript:

```css
.tooltip-trigger {
    anchor-name: --trigger;
}

.tooltip {
    position: fixed;
    position-anchor: --trigger;
    top: anchor(bottom);
    left: anchor(center);
    translate: -50% 0.5rem;

    /* Fallback positioning */
    position-try-fallbacks: flip-block;
}
```

- Replaces JavaScript tooltip/popover positioning libraries.
- `position-try-fallbacks` handles edge cases when the tooltip would go off-screen.
- Works with `popover` attribute for layered UI.

## Scroll-Driven Animations

Animate based on scroll position, no JavaScript:

```css
.progress-bar {
    animation: grow-width linear;
    animation-timeline: scroll();
}

@keyframes grow-width {
    from {
        width: 0%;
    }
    to {
        width: 100%;
    }
}

/* Animate when element enters viewport */
.fade-in {
    animation: fade-in linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
}

@keyframes fade-in {
    from {
        opacity: 0;
        translate: 0 2rem;
    }
    to {
        opacity: 1;
        translate: 0;
    }
}
```

- `scroll()` — progress based on scroll container position.
- `view()` — progress based on element visibility in viewport.
- `animation-range` — define when the animation starts and ends.

## `@starting-style`

Animate from `display: none` without JavaScript:

```css
dialog[open] {
    opacity: 1;
    transform: scale(1);
    transition:
        opacity 0.3s,
        transform 0.3s;

    @starting-style {
        opacity: 0;
        transform: scale(0.95);
    }
}
```

Works with `popover`, `dialog`, and any element toggling `display`.

## Custom Properties Patterns

### Design Tokens

```css
:root {
    --color-primary: oklch(0.6 0.2 250);
    --color-surface: oklch(0.98 0 0);
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-4: 1rem;
}

[data-theme="dark"] {
    --color-primary: oklch(0.7 0.2 250);
    --color-surface: oklch(0.15 0 0);
}
```

### Component-Scoped Variables

```css
.button {
    --_bg: var(--color-primary);
    --_text: white;
    --_padding: var(--space-2) var(--space-4);

    background: var(--_bg);
    color: var(--_text);
    padding: var(--_padding);

    &.secondary {
        --_bg: transparent;
        --_text: var(--color-primary);
    }
}
```

Prefix internal variables with `_` to distinguish them from public API tokens.

## Color Functions

```css
/* OKLCH — perceptually uniform, wide gamut */
color: oklch(0.6 0.2 250);

/* Relative color syntax — derive colors */
--hover: oklch(from var(--color-primary) calc(l - 0.1) c h);
--muted: oklch(from var(--color-primary) l calc(c * 0.5) h);

/* color-mix — blend colors */
border-color: color-mix(in oklch, var(--color-primary) 20%, transparent);
```

Prefer `oklch` for design tokens — it produces perceptually consistent lightness and saturation scales.
