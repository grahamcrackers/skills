---
name: accessibility-patterns
description: Web accessibility (a11y) patterns for WCAG compliance, ARIA usage, semantic HTML, keyboard navigation, and focus management. Use when building accessible UI, reviewing components for a11y, adding ARIA attributes, handling keyboard interactions, or when the user asks about accessibility, WCAG, screen readers, or focus management.
---

# Accessibility Patterns

## Semantic HTML First

Use the correct HTML element before reaching for ARIA. Native elements provide keyboard behavior, focus management, and screen reader semantics for free:

| Need       | Use                                   | Not                     |
| ---------- | ------------------------------------- | ----------------------- |
| Button     | `<button>`                            | `<div onClick>`         |
| Link       | `<a href>`                            | `<span onClick>`        |
| Navigation | `<nav>`                               | `<div class="nav">`     |
| List       | `<ul>` / `<ol>`                       | `<div>` with divs       |
| Heading    | `<h1>`–`<h6>`                         | `<div class="title">`   |
| Form field | `<input>` / `<select>` / `<textarea>` | `<div contenteditable>` |
| Dialog     | `<dialog>`                            | `<div class="modal">`   |

The first rule of ARIA: don't use ARIA if a native HTML element does the job.

## ARIA Essentials

When native elements aren't sufficient:

### Roles

Add semantic meaning to generic elements:

```html
<div role="tablist">
    <button role="tab" aria-selected="true">Tab 1</button>
    <button role="tab" aria-selected="false">Tab 2</button>
</div>
<div role="tabpanel">Content</div>
```

### States and Properties

Communicate dynamic state to assistive technology:

```html
<button aria-expanded="false" aria-controls="menu-content">Menu</button>
<div id="menu-content" hidden>...</div>

<input aria-invalid="true" aria-describedby="error-msg" />
<span id="error-msg">Email is required</span>
```

### Live Regions

Announce dynamic content changes:

```html
<div aria-live="polite" aria-atomic="true">3 results found</div>

<div role="alert">Your session is about to expire.</div>
```

- `aria-live="polite"` — announces after current speech finishes.
- `aria-live="assertive"` or `role="alert"` — interrupts immediately (use sparingly).

### Labels

Every interactive element needs an accessible name:

```html
<!-- Visible label (preferred) -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- aria-label for icon-only buttons -->
<button aria-label="Close dialog"><CloseIcon /></button>

<!-- aria-labelledby for complex labels -->
<h2 id="section-title">Billing</h2>
<form aria-labelledby="section-title">...</form>
```

## Keyboard Navigation

### Focus Order

- Ensure logical tab order follows visual layout. Don't use `tabindex` > 0.
- Use `tabindex="0"` to make non-interactive elements focusable when necessary.
- Use `tabindex="-1"` to make elements programmatically focusable but not in the tab order.

### Key Handlers

Implement expected keyboard patterns for custom widgets:

| Widget   | Keys                                                     |
| -------- | -------------------------------------------------------- |
| Button   | Enter, Space to activate                                 |
| Menu     | Arrow keys to navigate, Enter to select, Escape to close |
| Tabs     | Arrow keys to switch, Enter/Space to activate            |
| Dialog   | Escape to close, trap focus inside                       |
| Combobox | Arrow keys to navigate, Enter to select, Escape to close |

```tsx
function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
        case "ArrowDown":
            e.preventDefault();
            focusNextItem();
            break;
        case "ArrowUp":
            e.preventDefault();
            focusPreviousItem();
            break;
        case "Escape":
            closeMenu();
            break;
    }
}
```

### Focus Trapping

Modal dialogs must trap focus — Tab and Shift+Tab cycle only through elements inside the dialog:

```tsx
function trapFocus(dialogRef: RefObject<HTMLDialogElement>) {
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];

    function handleTab(e: KeyboardEvent) {
        if (e.key !== "Tab") return;
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
        }
    }

    dialogRef.current?.addEventListener("keydown", handleTab);
}
```

### Focus Restoration

When a dialog/popover closes, return focus to the element that triggered it:

```tsx
const triggerRef = useRef<HTMLButtonElement>(null);

function openDialog() {
    triggerRef.current = document.activeElement as HTMLButtonElement;
    setOpen(true);
}

function closeDialog() {
    setOpen(false);
    triggerRef.current?.focus();
}
```

## Color and Contrast

- Minimum contrast ratio: **4.5:1** for normal text, **3:1** for large text (WCAG AA).
- Never rely on color alone to convey meaning — add icons, text, or patterns.
- Test with forced-colors mode (Windows High Contrast).

## Motion

Respect the user's motion preference:

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

```tsx
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

## Forms

- Associate every input with a `<label>`.
- Group related fields with `<fieldset>` and `<legend>`.
- Display error messages inline, linked with `aria-describedby`.
- Use `aria-required="true"` or the `required` attribute.
- Mark invalid fields with `aria-invalid="true"`.

## Images

```html
<!-- Informative image -->
<img src="chart.png" alt="Sales increased 25% in Q4 2025" />

<!-- Decorative image -->
<img src="divider.svg" alt="" role="presentation" />

<!-- Complex image -->
<figure>
    <img src="diagram.png" alt="System architecture overview" />
    <figcaption>Request flow from client through API gateway to microservices</figcaption>
</figure>
```

## Testing

- **Keyboard-only**: Tab through the entire page without a mouse.
- **Screen reader**: Test with VoiceOver (macOS), NVDA (Windows), or TalkBack (Android).
- **Automated**: Use `axe-core`, `eslint-plugin-jsx-a11y`, or Lighthouse accessibility audit.
- **Manual**: Zoom to 200%, use forced colors, test with `prefers-reduced-motion`.
- **Testing Library**: Use `getByRole`, `getByLabelText` — if you can't query by role, the component may have an a11y issue.
