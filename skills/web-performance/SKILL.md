---
name: web-performance
description: Web performance optimization patterns including Core Web Vitals, bundle analysis, lazy loading, image optimization, caching strategies, rendering performance, and monitoring. Use when optimizing page load speed, reducing bundle size, improving CWV scores, profiling render performance, or when the user asks about web performance, Core Web Vitals, or page speed.
---

# Web Performance Patterns

## Core Web Vitals

| Metric                              | What It Measures     | Good    | Needs Work |
| ----------------------------------- | -------------------- | ------- | ---------- |
| **LCP** (Largest Contentful Paint)  | Main content visible | ≤ 2.5s  | > 4.0s     |
| **INP** (Interaction to Next Paint) | Input responsiveness | ≤ 200ms | > 500ms    |
| **CLS** (Cumulative Layout Shift)   | Visual stability     | ≤ 0.1   | > 0.25     |

### Measuring

```typescript
import { onLCP, onINP, onCLS } from "web-vitals";

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

Use Chrome DevTools Performance panel, Lighthouse, or PageSpeed Insights for detailed analysis.

## Bundle Size

### Analysis

```shell
# Vite
npx vite-bundle-visualizer

# Webpack
npx webpack-bundle-analyzer stats.json
```

### Reduction Strategies

**Code splitting** — split by route and lazy-load:

```tsx
const Dashboard = lazy(() => import("./pages/dashboard"));

<Suspense fallback={<DashboardSkeleton />}>
    <Dashboard />
</Suspense>;
```

**Dynamic imports** for heavy libraries:

```typescript
async function generateChart(data: ChartData) {
    const { Chart } = await import("chart.js");
    return new Chart(canvas, { data });
}
```

**Tree-shaking** — use named imports, not namespace imports:

```typescript
// Tree-shakeable
import { debounce } from "lodash-es";

// NOT tree-shakeable
import _ from "lodash";
```

**Replace heavy dependencies**:

| Heavy    | Lighter Alternative                           |
| -------- | --------------------------------------------- |
| `moment` | `date-fns` or `dayjs`                         |
| `lodash` | `lodash-es` (named imports) or native methods |
| `axios`  | `fetch` API (built-in)                        |

### Vendor Chunking

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ["react", "react-dom"],
        router: ["react-router"],
      },
    },
  },
},
```

Separate stable vendor code from frequently changing app code for better cache hit rates.

## Image Optimization

### Modern Formats

Serve WebP or AVIF with fallbacks:

```html
<picture>
    <source srcset="hero.avif" type="image/avif" />
    <source srcset="hero.webp" type="image/webp" />
    <img src="hero.jpg" alt="Hero image" width="1200" height="600" />
</picture>
```

### Responsive Images

```html
<img
    src="photo-800.jpg"
    srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
    sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
    alt="Product photo"
    width="800"
    height="600"
    loading="lazy"
    decoding="async"
/>
```

### Key Rules

- **Always set `width` and `height`** — prevents CLS during load.
- **Use `loading="lazy"`** on below-the-fold images.
- **Use `loading="eager"`** (default) for the LCP image.
- **Use `fetchpriority="high"`** on the LCP image.
- **Use `decoding="async"`** to avoid blocking the main thread.

```html
<!-- LCP image — load immediately with high priority -->
<img src="hero.jpg" alt="Hero" width="1200" height="600" fetchpriority="high" />

<!-- Below-fold images — lazy load -->
<img src="product.jpg" alt="Product" width="400" height="300" loading="lazy" decoding="async" />
```

## Font Optimization

```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
```

```css
@font-face {
    font-family: "Inter";
    src: url("/fonts/inter.woff2") format("woff2");
    font-display: swap; /* show fallback immediately, swap when loaded */
    unicode-range: U+0000-00FF; /* subset to Latin characters */
}
```

- Use `font-display: swap` to avoid invisible text during load.
- Subset fonts to only the character sets you need.
- Self-host fonts rather than loading from Google Fonts (eliminates extra DNS lookup).

## Resource Hints

```html
<!-- DNS prefetch for third-party domains -->
<link rel="dns-prefetch" href="https://api.example.com" />

<!-- Preconnect for critical third-party origins -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />

<!-- Prefetch likely next-page resources -->
<link rel="prefetch" href="/dashboard.js" />

<!-- Preload critical resources for current page -->
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/hero.webp" as="image" />
```

## Rendering Performance

### Avoid Layout Thrashing

Read layout properties, then batch writes:

```typescript
// Bad — forces layout per iteration
elements.forEach((el) => {
    el.style.width = `${el.offsetWidth + 10}px`; // read + write in loop
});

// Good — batch reads, then writes
const widths = elements.map((el) => el.offsetWidth);
elements.forEach((el, i) => {
    el.style.width = `${widths[i] + 10}px`;
});
```

### CSS Containment

Tell the browser which parts of the page are independent:

```css
.card {
    contain: layout style paint;
    content-visibility: auto;
    contain-intrinsic-size: 0 200px;
}
```

- `contain` limits the scope of browser layout/paint calculations.
- `content-visibility: auto` skips rendering off-screen content entirely.
- `contain-intrinsic-size` provides a placeholder size to prevent CLS.

### Animate the Right Properties

```css
/* Fast — compositor only */
transform: translateX(100px);
opacity: 0.5;

/* Slow — triggers layout */
width: 200px;
height: 100px;
top: 50px;
left: 100px;
```

Use `transform` and `opacity` for animations. Use `will-change` sparingly on elements that will animate.

## React-Specific

### Virtualization

Render only visible items in long lists:

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }: { items: Item[] }) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 50,
        overscan: 5,
    });

    return (
        <div ref={parentRef} style={{ height: 400, overflow: "auto" }}>
            <div style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: "absolute",
                            top: virtualItem.start,
                            height: virtualItem.size,
                        }}
                    >
                        {items[virtualItem.index].name}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### Transition API

Defer non-urgent updates to keep the UI responsive:

```tsx
import { startTransition, useTransition } from "react";

function SearchResults() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isPending, startTransition] = useTransition();

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value);
        startTransition(() => {
            setResults(filterItems(e.target.value)); // deferred
        });
    }

    return (
        <div>
            <input value={query} onChange={handleChange} />
            {isPending && <Spinner />}
            <ResultList results={results} />
        </div>
    );
}
```

## Caching Strategy

### HTTP Cache Headers

| Resource                     | Cache-Control                              | Why                                  |
| ---------------------------- | ------------------------------------------ | ------------------------------------ |
| Hashed assets (`.abc123.js`) | `max-age=31536000, immutable`              | Content-addressed, never changes     |
| HTML                         | `no-cache` or `max-age=0, must-revalidate` | Always check for updates             |
| API responses                | `max-age=60, stale-while-revalidate=300`   | Fresh for 1min, serve stale for 5min |
| Fonts                        | `max-age=31536000, immutable`              | Rarely change                        |

### Service Worker

For offline support and fine-grained cache control:

```typescript
// Cache-first for static assets
self.addEventListener("fetch", (event) => {
    if (event.request.destination === "image") {
        event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
    }
});
```

## Performance Budget

Set limits and fail CI if exceeded:

```jsonc
// bundlesize config or Lighthouse CI
{
    "files": [
        { "path": "dist/index.js", "maxSize": "150 kB" },
        { "path": "dist/vendor.js", "maxSize": "200 kB" },
        { "path": "dist/index.css", "maxSize": "30 kB" },
    ],
}
```

## Monitoring Checklist

- [ ] LCP ≤ 2.5s (LCP image has `fetchpriority="high"`, no lazy loading)
- [ ] INP ≤ 200ms (no long tasks blocking main thread)
- [ ] CLS ≤ 0.1 (all images/embeds have explicit dimensions)
- [ ] Total JS bundle < 300 KB gzipped (code-split per route)
- [ ] Fonts preloaded with `font-display: swap`
- [ ] Below-fold images use `loading="lazy"`
- [ ] Vendor chunks separated for long-term caching
