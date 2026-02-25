---
name: storybook
description: Storybook 8 patterns for component-driven development including writing stories, args and controls, interaction testing, documentation, and addon configuration. Use when building component libraries, writing stories, testing interactions, documenting components, or when the user asks about Storybook, component isolation, or visual testing.
---

# Storybook 8 Best Practices

## Setup

```shell
npx storybook@latest init
```

This auto-detects your framework (React, Vue, etc.) and configures everything.

## Writing Stories

### Basic Story (CSF3)

```tsx
// button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta = {
    title: "Components/Button",
    component: Button,
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["primary", "secondary", "danger"],
        },
        size: {
            control: "radio",
            options: ["sm", "md", "lg"],
        },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        variant: "primary",
        children: "Click me",
    },
};

export const Secondary: Story = {
    args: {
        variant: "secondary",
        children: "Cancel",
    },
};

export const Disabled: Story = {
    args: {
        ...Primary.args,
        disabled: true,
    },
};
```

### Key Concepts

- **Meta** — default configuration for all stories in the file (component, title, argTypes).
- **Story** — a specific state of the component with defined `args`.
- **Args** — props passed to the component, editable via Controls panel.
- **Tags** — `["autodocs"]` auto-generates a documentation page.

## Args and Controls

Controls are auto-generated from TypeScript props. Customize them with `argTypes`:

```tsx
argTypes: {
  onClick: { action: "clicked" },        // log to Actions panel
  color: { control: "color" },            // color picker
  count: { control: { type: "range", min: 0, max: 100 } },
  status: {
    control: "select",
    options: ["idle", "loading", "error"],
    description: "Current status of the widget",
    table: { defaultValue: { summary: "idle" } },
  },
},
```

## Decorators

Wrap stories with providers, layouts, or context:

```tsx
// Per-story
export const WithTheme: Story = {
    decorators: [
        (Story) => (
            <ThemeProvider theme="dark">
                <Story />
            </ThemeProvider>
        ),
    ],
};

// Global (in .storybook/preview.tsx)
const preview: Preview = {
    decorators: [
        (Story) => (
            <QueryClientProvider client={queryClient}>
                <Story />
            </QueryClientProvider>
        ),
    ],
};
```

## Interaction Testing

Write tests inside stories using the `play` function:

```tsx
import { expect, fn, userEvent, within } from "@storybook/test";

export const SubmitForm: Story = {
    args: {
        onSubmit: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        await userEvent.type(canvas.getByLabelText("Email"), "test@example.com");
        await userEvent.type(canvas.getByLabelText("Password"), "password123");
        await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));

        await expect(args.onSubmit).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "password123",
        });
    },
};

export const ValidationError: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));

        await expect(canvas.getByText("Email is required")).toBeInTheDocument();
    },
};
```

- Import testing utilities from `@storybook/test` (not directly from Testing Library).
- Use `fn()` for spy/mock functions with Actions panel integration.
- Use `within(canvasElement)` to scope queries to the story's render area.
- Tests run in the browser and are visible in the Interactions panel.

### Running Tests

```shell
# Run interaction tests via test-runner
npx test-storybook

# With coverage
npx test-storybook --coverage
```

## Component Documentation

### Autodocs

Add `tags: ["autodocs"]` to meta for auto-generated docs:

```tsx
const meta = {
    title: "Components/Button",
    component: Button,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component: "Primary UI button for user actions.",
            },
        },
    },
} satisfies Meta<typeof Button>;
```

### MDX Docs

For custom documentation pages:

```mdx
{/* button.mdx */}
import { Canvas, Meta, Story } from "@storybook/blocks";
import \* as ButtonStories from "./button.stories";

<Meta of={ButtonStories} />

# Button

Buttons trigger actions. Use primary for the main CTA and secondary for alternatives.

<Canvas of={ButtonStories.Primary} />

## Variants

<Canvas of={ButtonStories.Secondary} />
<Canvas of={ButtonStories.Disabled} />
```

## Story Organization

### File Structure

Colocate stories with components:

```
components/
└── button/
    ├── button.tsx
    ├── button.stories.tsx
    ├── button.test.tsx
    └── index.ts
```

### Naming Hierarchy

```tsx
// title creates the sidebar structure
title: "Components/Forms/Input"; // Components > Forms > Input
title: "Components/Button"; // Components > Button
title: "Pages/Dashboard"; // Pages > Dashboard
```

## Parameters

Configure story-level or global behavior:

```tsx
export const Mobile: Story = {
    parameters: {
        viewport: { defaultViewport: "mobile1" },
        layout: "fullscreen",
    },
};

export const DarkMode: Story = {
    parameters: {
        backgrounds: { default: "dark" },
    },
};
```

## Loaders

Fetch data before a story renders:

```tsx
export const WithData: Story = {
    loaders: [
        async () => ({
            users: await fetch("/api/users").then((r) => r.json()),
        }),
    ],
    render: (args, { loaded: { users } }) => <UserList users={users} {...args} />,
};
```

## Configuration

### Main Config

```typescript
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
    addons: ["@storybook/addon-essentials", "@storybook/addon-interactions", "@storybook/addon-a11y"],
    framework: "@storybook/react-vite",
    typescript: {
        reactDocgen: "react-docgen-typescript",
    },
};

export default config;
```

### Useful Addons

| Addon                           | Purpose                                        |
| ------------------------------- | ---------------------------------------------- |
| `@storybook/addon-essentials`   | Controls, Actions, Viewport, Backgrounds, Docs |
| `@storybook/addon-interactions` | Step-through interaction testing               |
| `@storybook/addon-a11y`         | Accessibility audit via axe-core               |
| `@storybook/addon-designs`      | Embed Figma designs alongside stories          |
| `@chromatic-com/storybook`      | Visual regression testing with Chromatic       |

## Patterns

- **One story per meaningful state** — Primary, Disabled, Loading, Error, Empty, WithData.
- **Use args composition** — spread a base story's args into variants instead of duplicating.
- **Test edge cases** — long text, empty data, error states, loading states, RTL.
- **Use decorators for context** — providers, layouts, themes.
- **Keep stories independent** — each story should work in isolation.
- **Add `autodocs`** to all public components for automatic documentation.
