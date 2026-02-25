---
name: msw
description: Mock Service Worker (MSW) patterns for API mocking in development and testing. Covers request handlers, response mocking, network error simulation, handler composition, and integration with Vitest and Storybook. Use when mocking APIs, simulating network responses, testing error states, or when the user asks about MSW, API mocking, or mock servers.
---

# MSW (Mock Service Worker) Patterns

## Setup

```shell
npm install -D msw
npx msw init ./public --save  # for browser integration
```

## Request Handlers

### REST Handlers

```typescript
// src/testing/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
    http.get("/api/users", () => {
        return HttpResponse.json([
            { id: "1", name: "Alice", email: "alice@example.com" },
            { id: "2", name: "Bob", email: "bob@example.com" },
        ]);
    }),

    http.get("/api/users/:id", ({ params }) => {
        const { id } = params;
        return HttpResponse.json({
            id,
            name: "Alice",
            email: "alice@example.com",
        });
    }),

    http.post("/api/users", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: "3", ...body }, { status: 201 });
    }),

    http.patch("/api/users/:id", async ({ params, request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: params.id, ...body });
    }),

    http.delete("/api/users/:id", () => {
        return new HttpResponse(null, { status: 204 });
    }),
];
```

### GraphQL Handlers

```typescript
import { graphql, HttpResponse } from "msw";

export const graphqlHandlers = [
    graphql.query("GetUsers", () => {
        return HttpResponse.json({
            data: {
                users: [
                    { id: "1", name: "Alice" },
                    { id: "2", name: "Bob" },
                ],
            },
        });
    }),

    graphql.mutation("CreateUser", async ({ variables }) => {
        return HttpResponse.json({
            data: {
                createUser: { id: "3", name: variables.name },
            },
        });
    }),
];
```

## Server Setup (Node / Tests)

```typescript
// src/testing/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

```typescript
// src/testing/setup.ts
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- `server.listen()` intercepts outgoing requests.
- `server.resetHandlers()` clears per-test overrides after each test.
- `onUnhandledRequest: "warn"` logs unhandled requests (catch missing handlers).

## Browser Setup (Development)

```typescript
// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "../testing/handlers";

export const worker = setupWorker(...handlers);
```

```typescript
// src/main.tsx
async function enableMocking() {
  if (process.env.NODE_ENV !== "development") return;

  const { worker } = await import("./mocks/browser");
  return worker.start({
    onUnhandledRequest: "bypass",
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
```

This lets you develop against mocked APIs before the backend is ready.

## Per-Test Overrides

Override handlers in individual tests for specific scenarios:

```typescript
import { http, HttpResponse } from "msw";
import { server } from "../testing/server";

test("shows error when API fails", async () => {
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json(
        { message: "Internal server error" },
        { status: 500 },
      );
    }),
  );

  render(<UserList />);
  expect(await screen.findByText("Failed to load users")).toBeInTheDocument();
});

test("shows empty state when no users", async () => {
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json([]);
    }),
  );

  render(<UserList />);
  expect(await screen.findByText("No users found")).toBeInTheDocument();
});
```

Overrides are scoped to the test — `resetHandlers()` restores defaults after each test.

## Network Errors

Simulate failures:

```typescript
import { http, HttpResponse } from "msw";

// Network error (connection refused, timeout)
http.get("/api/users", () => {
  return HttpResponse.error();
}),

// Delayed response
http.get("/api/users", async () => {
  await delay(3000);
  return HttpResponse.json([]);
}),

// Custom status codes
http.get("/api/users", () => {
  return HttpResponse.json(
    { message: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}),
```

## Response Utilities

### Dynamic Responses

```typescript
let users = [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
];

export const handlers = [
    http.get("/api/users", () => {
        return HttpResponse.json(users);
    }),

    http.post("/api/users", async ({ request }) => {
        const body = await request.json();
        const newUser = { id: String(users.length + 1), ...body };
        users.push(newUser);
        return HttpResponse.json(newUser, { status: 201 });
    }),

    http.delete("/api/users/:id", ({ params }) => {
        users = users.filter((u) => u.id !== params.id);
        return new HttpResponse(null, { status: 204 });
    }),
];
```

### Response Headers

```typescript
http.get("/api/data", () => {
  return HttpResponse.json(data, {
    headers: {
      "X-Total-Count": "42",
      "X-Request-Id": crypto.randomUUID(),
    },
  });
}),
```

### Cookies

```typescript
http.post("/api/login", () => {
  return HttpResponse.json(
    { user: { name: "Alice" } },
    {
      headers: {
        "Set-Cookie": "session=abc123; Path=/; HttpOnly",
      },
    },
  );
}),
```

## Request Matching

### URL Parameters

```typescript
http.get("/api/users/:id/posts/:postId", ({ params }) => {
  const { id, postId } = params;
  return HttpResponse.json({ userId: id, postId });
}),
```

### Query Parameters

```typescript
http.get("/api/users", ({ request }) => {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") ?? "1";
  const limit = url.searchParams.get("limit") ?? "10";

  return HttpResponse.json({
    items: users.slice(0, Number(limit)),
    page: Number(page),
    total: users.length,
  });
}),
```

### Request Body

```typescript
http.post("/api/users", async ({ request }) => {
  const body = await request.json();

  if (!body.email) {
    return HttpResponse.json(
      { errors: { email: "Required" } },
      { status: 422 },
    );
  }

  return HttpResponse.json({ id: "1", ...body }, { status: 201 });
}),
```

## Handler Composition

Organize handlers by domain:

```typescript
// testing/handlers/users.ts
export const userHandlers = [
  http.get("/api/users", ...),
  http.post("/api/users", ...),
];

// testing/handlers/posts.ts
export const postHandlers = [
  http.get("/api/posts", ...),
];

// testing/handlers/index.ts
export const handlers = [
  ...userHandlers,
  ...postHandlers,
];
```

## Storybook Integration

```typescript
// .storybook/preview.ts
import { initialize, mswLoader } from "msw-storybook-addon";

initialize();

const preview: Preview = {
    loaders: [mswLoader],
};
```

```tsx
// user-list.stories.tsx
import { http, HttpResponse } from "msw";

export const Default: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/users", () => {
                    return HttpResponse.json([{ id: "1", name: "Alice" }]);
                }),
            ],
        },
    },
};

export const Error: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/users", () => {
                    return HttpResponse.json({ message: "Error" }, { status: 500 });
                }),
            ],
        },
    },
};
```

## File Structure

```
src/
├── testing/
│   ├── handlers/
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   └── index.ts
│   ├── server.ts        # Node.js server (tests)
│   └── setup.ts         # test setup
└── mocks/
    └── browser.ts       # browser worker (dev)
public/
    └── mockServiceWorker.js  # MSW service worker
```

## Guidelines

- **Mock at the network boundary** — MSW intercepts `fetch`/`XMLHttpRequest`, so your app code stays unchanged.
- **Share handlers** between tests, Storybook, and dev — one source of truth.
- **Override per-test** — use `server.use()` for scenario-specific responses.
- **Use `onUnhandledRequest: "warn"`** in tests to catch missing handlers.
- **Use `onUnhandledRequest: "bypass"`** in browser to let real requests through.
- **Reset after each test** — always call `server.resetHandlers()` to prevent leaking.
