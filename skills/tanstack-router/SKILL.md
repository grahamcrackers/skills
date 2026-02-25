---
name: tanstack-router
description: TanStack Router patterns for type-safe routing in React including file-based routes, search params validation, data loading, authenticated routes, and code splitting. Use when setting up routing, creating routes, handling search params, loading route data, or when the user asks about TanStack Router, type-safe routing, or client-side navigation.
---

# TanStack Router Best Practices

## Setup

```shell
npm install @tanstack/react-router
npm install -D @tanstack/router-plugin
```

### Vite Plugin

```typescript
// vite.config.ts
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
    plugins: [TanStackRouterVite(), react()],
});
```

The plugin generates a type-safe route tree from your file structure.

## Router Registration

Register your router type globally for full type safety:

```typescript
// src/router.ts
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
```

This enables type-safe `Link`, `useNavigate`, `useParams`, and `useSearch` across your entire app.

## File-Based Routing

```
src/routes/
├── __root.tsx           # Root layout (always rendered)
├── index.tsx            # /
├── about.tsx            # /about
├── users/
│   ├── index.tsx        # /users
│   ├── $userId.tsx      # /users/:userId (dynamic param)
│   └── $userId/
│       └── posts.tsx    # /users/:userId/posts
├── _auth/               # Layout route group (no URL segment)
│   ├── route.tsx        # Auth layout wrapper
│   ├── dashboard.tsx    # /dashboard (wrapped in auth layout)
│   └── settings.tsx     # /settings (wrapped in auth layout)
└── _auth.tsx            # Layout route file
```

### Naming Conventions

| Pattern       | Purpose                               | Example            |
| ------------- | ------------------------------------- | ------------------ |
| `index.tsx`   | Index route                           | `/users`           |
| `$param.tsx`  | Dynamic parameter                     | `/users/:userId`   |
| `_layout/`    | Layout group (no URL segment)         | Auth wrapper       |
| `_layout.tsx` | Layout route component                | Layout with outlet |
| `$.tsx`       | Splat / catch-all                     | `/files/*`         |
| `(group)/`    | Pathless grouping (organization only) | Feature grouping   |

## Root Route

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
    component: () => (
        <>
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </>
    ),
    notFoundComponent: () => <NotFound />,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
});
```

## Route Components

```tsx
// src/routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId")({
    component: UserPage,
    loader: async ({ params }) => {
        return fetchUser(params.userId);
    },
    errorComponent: ({ error }) => <div>User not found</div>,
});

function UserPage() {
    const { userId } = Route.useParams();
    const user = Route.useLoaderData();

    return <div>{user.name}</div>;
}
```

## Search Params

Type-safe, validated search params using Zod or inline validators:

```tsx
import { z } from "zod";

const userSearchSchema = z.object({
    page: z.number().default(1),
    sort: z.enum(["name", "date"]).default("name"),
    filter: z.string().optional(),
});

export const Route = createFileRoute("/users/")({
    validateSearch: userSearchSchema,
    component: UsersPage,
});

function UsersPage() {
    const { page, sort, filter } = Route.useSearch();
    const navigate = Route.useNavigate();

    function setPage(newPage: number) {
        navigate({ search: (prev) => ({ ...prev, page: newPage }) });
    }

    return <UserList page={page} sort={sort} filter={filter} />;
}
```

Search params are validated, defaulted, and fully typed.

## Data Loading

### Route Loaders

```tsx
export const Route = createFileRoute("/users/$userId")({
    loader: async ({ params, context }) => {
        const user = await context.queryClient.ensureQueryData(userQueryOptions(params.userId));
        return { user };
    },
});
```

### With TanStack Query

Integrate with TanStack Query for caching and background updates:

```tsx
import { queryOptions } from "@tanstack/react-query";

function userQueryOptions(userId: string) {
    return queryOptions({
        queryKey: ["users", userId],
        queryFn: () => api.users.getById(userId),
    });
}

export const Route = createFileRoute("/users/$userId")({
    loader: ({ params, context }) => {
        return context.queryClient.ensureQueryData(userQueryOptions(params.userId));
    },
    component: UserPage,
});

function UserPage() {
    const { userId } = Route.useParams();
    const { data: user } = useSuspenseQuery(userQueryOptions(userId));

    return <div>{user.name}</div>;
}
```

### Providing Context

Pass shared dependencies (query client, auth) via router context:

```tsx
const router = createRouter({
    routeTree,
    context: {
        queryClient,
        auth: undefined!, // set at render time
    },
});

// In root
function App() {
    const auth = useAuth();
    return <RouterProvider router={router} context={{ auth }} />;
}
```

## Authenticated Routes

```tsx
// src/routes/_auth.tsx
export const Route = createFileRoute("/_auth")({
    beforeLoad: ({ context, location }) => {
        if (!context.auth.isAuthenticated) {
            throw redirect({
                to: "/login",
                search: { redirect: location.href },
            });
        }
    },
    component: () => <Outlet />,
});
```

All routes under `_auth/` are protected. Unauthenticated users are redirected to login with a return URL.

## Navigation

### Type-Safe Links

```tsx
import { Link } from "@tanstack/react-router";

<Link to="/users/$userId" params={{ userId: "123" }}>
  View User
</Link>

<Link
  to="/users"
  search={{ page: 2, sort: "name" }}
  activeProps={{ className: "active" }}
>
  Users
</Link>
```

### Programmatic Navigation

```tsx
const navigate = useNavigate();

navigate({ to: "/users/$userId", params: { userId: "123" } });
navigate({ to: "/users", search: (prev) => ({ ...prev, page: 2 }) });
navigate({ to: "..", replace: true }); // relative navigation
```

## Code Splitting

Lazy-load route components:

```tsx
// src/routes/dashboard.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
    component: () => import("./dashboard-component").then((m) => m.Dashboard),
});
```

Or use the `lazyRouteComponent` helper:

```tsx
import { lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
    component: lazyRouteComponent(() => import("./dashboard-component")),
});
```

## Pending UI

Show loading states during navigation:

```tsx
export const Route = createFileRoute("/users")({
    loader: () => fetchUsers(),
    pendingComponent: () => <UserListSkeleton />,
    pendingMinMs: 200, // avoid flash for fast loads
    pendingMs: 1000, // show pending after 1s
});
```

## Not Found Handling

```tsx
// Per-route
export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);
    if (!user) throw notFound();
    return user;
  },
  notFoundComponent: () => <div>User not found</div>,
});

// Global fallback (in __root.tsx)
notFoundComponent: () => <NotFoundPage />,
```

## Devtools

```tsx
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

// In root layout
<TanStackRouterDevtools position="bottom-right" />;
```
