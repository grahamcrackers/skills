---
name: framer-motion
description: Framer Motion animation patterns for React including transitions, variants, layout animations, AnimatePresence, gestures, scroll animations, and performance optimization. Use when animating React components, building transitions, adding micro-interactions, or when the user asks about Framer Motion, React animation, or motion design.
---

# Framer Motion Patterns

## Setup

```shell
npm install motion
```

```tsx
import { motion, AnimatePresence } from "motion/react";
```

The package is `motion` (formerly `framer-motion`). Import from `motion/react`.

## Basic Animation

```tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    Content
</motion.div>
```

- `initial` — starting state (on mount).
- `animate` — target state.
- `transition` — how to animate between states.

## Transitions

```tsx
// Spring (default, feels natural)
transition={{ type: "spring", stiffness: 300, damping: 30 }}

// Tween (duration-based)
transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}

// Spring with bounce
transition={{ type: "spring", bounce: 0.4 }}

// Per-property transitions
transition={{
  opacity: { duration: 0.2 },
  y: { type: "spring", stiffness: 300 },
}}
```

## Variants

Define named animation states for orchestrated, reusable animations:

```tsx
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

function List({ items }: { items: Item[] }) {
    return (
        <motion.ul variants={container} initial="hidden" animate="show">
            {items.map((i) => (
                <motion.li key={i.id} variants={item}>
                    {i.name}
                </motion.li>
            ))}
        </motion.ul>
    );
}
```

Variants propagate — children inherit `initial` and `animate` from the parent. `staggerChildren` delays each child's animation for a cascade effect.

## Enter / Exit Animations

`AnimatePresence` enables exit animations when components unmount:

```tsx
<AnimatePresence mode="wait">
    {isVisible && (
        <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            <Modal />
        </motion.div>
    )}
</AnimatePresence>
```

- `mode="wait"` — waits for the exiting element to finish before entering the new one.
- `mode="sync"` — enter and exit happen simultaneously.
- `mode="popLayout"` — removes exiting element from layout flow immediately.
- Always provide a unique `key` on direct children of `AnimatePresence`.

## Layout Animations

Animate layout changes (reordering, resizing) with a single prop:

```tsx
<motion.div layout>{isExpanded ? <ExpandedContent /> : <CollapsedContent />}</motion.div>
```

### Shared Layout Animations

Animate an element smoothly between positions across components:

```tsx
function Tabs({ activeTab }: { activeTab: string }) {
    return (
        <div>
            {tabs.map((tab) => (
                <button key={tab.id}>
                    {tab.label}
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="active-tab"
                            className="active-indicator"
                            transition={{ type: "spring", bounce: 0.2 }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
```

`layoutId` connects two elements across renders — Framer Motion animates smoothly between their positions.

## Gestures

### Hover and Tap

```tsx
<motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
    Click me
</motion.button>
```

### Drag

```tsx
<motion.div
  drag
  dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
  dragElastic={0.2}
  dragSnapToOrigin
>
  Drag me
</motion.div>

// Constrain to a parent ref
<motion.div drag dragConstraints={containerRef} />
```

## Scroll Animations

### Scroll-Triggered

```tsx
import { motion, useInView } from "motion/react";

function FadeInSection({ children }: { children: React.ReactNode }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
        >
            {children}
        </motion.div>
    );
}
```

### Scroll-Linked

```tsx
import { motion, useScroll, useTransform } from "motion/react";

function ProgressBar() {
    const { scrollYProgress } = useScroll();

    return (
        <motion.div
            style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
            className="fixed top-0 left-0 right-0 h-1 bg-blue-500"
        />
    );
}

function Parallax() {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, -150]);

    return <motion.div style={{ y }}>Parallax content</motion.div>;
}
```

## Performance

### Animate the Right Properties

Stick to `transform` and `opacity` — they run on the compositor and don't trigger layout:

```tsx
// Fast (compositor)
animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}

// Slow (triggers layout)
animate={{ width: 200, height: 100, top: 50 }}
```

Use `layout` prop for size/position changes — it uses transforms under the hood.

### Bundle Size

Use `LazyMotion` to reduce the bundle by loading features on demand:

```tsx
import { LazyMotion, domAnimation, m } from "motion/react";

function App() {
    return (
        <LazyMotion features={domAnimation}>
            <m.div animate={{ opacity: 1 }} />
        </LazyMotion>
    );
}
```

- `domAnimation` — basic animations (~15KB).
- `domMax` — full feature set including layout animations.
- Use `m` instead of `motion` inside `LazyMotion`.

### Reduced Motion

Respect user preferences:

```tsx
import { useReducedMotion } from "motion/react";

function AnimatedCard() {
    const shouldReduce = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduce ? 0 : 0.3 }}
        >
            Content
        </motion.div>
    );
}
```

## Common Recipes

### Page Transitions

```tsx
const pageVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
        >
            {children}
        </motion.div>
    );
}
```

### Toast / Notification

```tsx
<AnimatePresence>
    {toasts.map((toast) => (
        <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
        >
            {toast.message}
        </motion.div>
    ))}
</AnimatePresence>
```

### Accordion

```tsx
<motion.div
    initial={false}
    animate={{ height: isOpen ? "auto" : 0 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    style={{ overflow: "hidden" }}
>
    <div>{content}</div>
</motion.div>
```
