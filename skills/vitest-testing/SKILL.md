---
name: vitest-testing
description: Vitest and Testing Library patterns for unit, component, and integration tests in TypeScript and React projects. Covers test organization, mocking, assertions, component testing, and MSW integration. Use when writing tests, setting up Vitest, mocking dependencies, testing React components, or when the user asks about testing patterns or test configuration.
---

# Vitest Testing Patterns

## Setup

```shell
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/testing/setup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: ["src/**/*.test.*", "src/testing/**"],
        },
    },
});
```

```typescript
// src/testing/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
    cleanup();
});
```

## File Organization

Colocate test files with the code they test:

```
components/
└── button/
    ├── button.tsx
    ├── button.test.tsx
    └── index.ts
hooks/
└── use-debounce.ts
└── use-debounce.test.ts
testing/
├── setup.ts           # global test setup
├── utils.tsx           # custom render, providers
├── handlers.ts         # MSW handlers
└── factories.ts        # test data factories
```

## Writing Tests

### Structure

```typescript
describe("calculateTotal", () => {
    it("sums item prices", () => {
        const items = [{ price: 10 }, { price: 20 }];
        expect(calculateTotal(items)).toBe(30);
    });

    it("returns 0 for empty array", () => {
        expect(calculateTotal([])).toBe(0);
    });

    it("applies discount when provided", () => {
        const items = [{ price: 100 }];
        expect(calculateTotal(items, { discount: 0.1 })).toBe(90);
    });
});
```

- Test behavior, not implementation.
- One assertion per test when possible — makes failures easy to diagnose.
- Use descriptive names: `it("returns 0 for empty array")`, not `it("works")`.

### Component Testing

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("LoginForm", () => {
    it("submits with email and password", async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();

        render(<LoginForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText("Email"), "test@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(onSubmit).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "password123",
        });
    });

    it("shows validation error for invalid email", async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={vi.fn()} />);

        await user.type(screen.getByLabelText("Email"), "invalid");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
});
```

### Query Priority

Use queries in this order (most accessible to least):

1. `getByRole` — buttons, links, headings, inputs by role
2. `getByLabelText` — form fields
3. `getByPlaceholderText` — when no label exists
4. `getByText` — non-interactive elements
5. `getByTestId` — last resort

If `getByRole` can't find the element, the component likely has an accessibility gap.

### Custom Render

Wrap with providers used throughout the app:

```tsx
// testing/utils.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

export function renderWithProviders(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
    return render(ui, { wrapper: createWrapper(), ...options });
}
```

## Mocking

### Functions

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ id: "1", name: "Test" });
mockFn.mockImplementation((x: number) => x * 2);

expect(mockFn).toHaveBeenCalledWith("arg");
expect(mockFn).toHaveBeenCalledTimes(1);
```

### Spying

```typescript
const spy = vi.spyOn(userService, "getUser");
spy.mockResolvedValue(mockUser);

// ... run code ...

expect(spy).toHaveBeenCalledWith("user-123");
spy.mockRestore();
```

### Modules

```typescript
vi.mock("@/lib/api-client", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));
```

### Timers

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("debounces input", async () => {
  render(<SearchInput />);
  await userEvent.type(screen.getByRole("textbox"), "query");

  vi.advanceTimersByTime(300);

  expect(onSearch).toHaveBeenCalledWith("query");
});
```

### Cleanup

Always restore mocks to prevent leaking between tests:

```typescript
afterEach(() => {
    vi.restoreAllMocks();
});
```

## MSW Integration

Mock API responses at the network level:

```shell
npm install -D msw
```

```typescript
// testing/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
    http.get("/api/users", () => {
        return HttpResponse.json([
            { id: "1", name: "Alice" },
            { id: "2", name: "Bob" },
        ]);
    }),

    http.post("/api/users", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: "3", ...body }, { status: 201 });
    }),
];
```

```typescript
// testing/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

```typescript
// testing/setup.ts
import { server } from "./server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Override handlers per test:

```typescript
it("shows error state on API failure", async () => {
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json({ message: "Server error" }, { status: 500 });
    })
  );

  renderWithProviders(<UserList />);
  expect(await screen.findByText("Failed to load users")).toBeInTheDocument();
});
```

## Testing Hooks

```typescript
import { renderHook, act } from "@testing-library/react";

describe("useCounter", () => {
    it("increments count", () => {
        const { result } = renderHook(() => useCounter());

        act(() => {
            result.current.increment();
        });

        expect(result.current.count).toBe(1);
    });
});
```

## Test Data Factories

Create consistent test data:

```typescript
// testing/factories.ts
let idCounter = 0;

export function createUser(overrides?: Partial<User>): User {
    idCounter++;
    return {
        id: `user-${idCounter}`,
        name: `User ${idCounter}`,
        email: `user${idCounter}@test.com`,
        role: "member",
        ...overrides,
    };
}
```

## Anti-Patterns

- **Don't test implementation** — test what the user sees and does, not internal state.
- **Don't snapshot everything** — snapshots are brittle. Use them only for small, stable outputs.
- **Don't mock what you don't own** — mock the boundary (MSW for HTTP, `vi.mock` for modules), not library internals.
- **Don't use `getByTestId` first** — reach for accessible queries first.
- **Don't forget `await`** — `userEvent` and `findBy*` queries are async.
