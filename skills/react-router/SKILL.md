---
name: react-router
description: React Router v7 patterns for client-side routing including nested routes, loaders, actions, route params, search params, navigation guards, and code splitting. Use when setting up React Router, creating routes, handling navigation, loading route data, or when the user asks about React Router, SPA routing, or route configuration.
---

# React Router v7 Best Practices

## Modes

React Router v7 offers two modes:

| Mode                  | Use When                                                |
| --------------------- | ------------------------------------------------------- |
| **Declarative (SPA)** | Client-side only app, no SSR needed                     |
| **Framework**         | Full-stack with SSR, loaders, and actions (Remix-style) |

This skill covers **declarative/SPA mode**. Use framework mode when you need SSR.

## Setup (SPA Mode)

```shell
npm install react-router
```

```tsx
import { BrowserRouter, Routes, Route } from "react-router";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="users" element={<Users />} />
                    <Route path="users/:userId" element={<UserDetail />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
```

## Route Configuration

### Object-Based Routes

```tsx
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
    {
        element: <Layout />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <Home /> },
            { path: "users", element: <Users /> },
            {
                path: "users/:userId",
                element: <UserDetail />,
                loader: userLoader,
            },
        ],
    },
]);

function App() {
    return <RouterProvider router={router} />;
}
```

Object-based config with `createBrowserRouter` is recommended — it enables loaders, actions, and error boundaries.

## Nested Routes and Layouts

```tsx
<Route element={<DashboardLayout />}>
    <Route index element={<DashboardHome />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="settings" element={<Settings />} />
</Route>
```

The layout component renders an `<Outlet />` where child routes appear:

```tsx
function DashboardLayout() {
    return (
        <div>
            <DashboardSidebar />
            <main>
                <Outlet />
            </main>
        </div>
    );
}
```

### Pathless Layout Routes

Wrap routes in a layout without adding a URL segment:

```tsx
<Route element={<AuthLayout />}>
    {/* These routes require authentication */}
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="profile" element={<Profile />} />
</Route>
```

## Route Parameters

```tsx
import { useParams } from "react-router";

function UserDetail() {
    const { userId } = useParams<{ userId: string }>();
    // fetch and render user
}
```

### Optional and Catch-All

```tsx
// Optional parameter
<Route path="users/:userId?" element={<Users />} />

// Catch-all / splat
<Route path="files/*" element={<FileViewer />} />
```

Access splat segments with `useParams()["*"]`.

## Search Params

```tsx
import { useSearchParams } from "react-router";

function UserList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get("page") ?? "1");
    const sort = searchParams.get("sort") ?? "name";

    function setPage(newPage: number) {
        setSearchParams((prev) => {
            prev.set("page", String(newPage));
            return prev;
        });
    }

    return <List page={page} sort={sort} onPageChange={setPage} />;
}
```

## Navigation

### Links

```tsx
import { Link, NavLink } from "react-router";

<Link to="/users/123">View User</Link>

<NavLink
  to="/dashboard"
  className={({ isActive }) => (isActive ? "active" : "")}
>
  Dashboard
</NavLink>
```

`NavLink` provides `isActive` and `isPending` states for styling active links.

### Programmatic Navigation

```tsx
import { useNavigate } from "react-router";

const navigate = useNavigate();

navigate("/users/123");
navigate("/users", { replace: true });
navigate(-1); // go back
navigate("/login", { state: { from: location.pathname } });
```

### Redirects

```tsx
import { Navigate } from "react-router";

<Route path="old-path" element={<Navigate to="/new-path" replace />} />;
```

## Loaders

Fetch data before a route renders (requires `createBrowserRouter`):

```tsx
async function userLoader({ params }: LoaderFunctionArgs) {
  const user = await api.users.getById(params.userId!);
  if (!user) throw new Response("Not Found", { status: 404 });
  return user;
}

// In route config
{ path: "users/:userId", element: <UserDetail />, loader: userLoader }
```

Access loader data in the component:

```tsx
import { useLoaderData } from "react-router";

function UserDetail() {
    const user = useLoaderData() as User;
    return <div>{user.name}</div>;
}
```

## Actions

Handle form submissions and mutations:

```tsx
async function createUserAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const user = await api.users.create(Object.fromEntries(formData));
  return redirect(`/users/${user.id}`);
}

// In route config
{ path: "users/new", element: <CreateUser />, action: createUserAction }
```

```tsx
import { Form, useActionData, useNavigation } from "react-router";

function CreateUser() {
    const errors = useActionData() as ValidationErrors | undefined;
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <Form method="post">
            <input name="name" />
            {errors?.name && <span>{errors.name}</span>}
            <button type="submit" disabled={isSubmitting}>
                Create
            </button>
        </Form>
    );
}
```

## Error Handling

```tsx
{
  path: "users/:userId",
  element: <UserDetail />,
  loader: userLoader,
  errorElement: <UserError />,
}
```

```tsx
import { useRouteError, isRouteErrorResponse } from "react-router";

function UserError() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <div>
                {error.status}: {error.statusText}
            </div>
        );
    }

    return <div>Something went wrong</div>;
}
```

Error boundaries catch errors from loaders, actions, and rendering. They bubble up to the nearest parent `errorElement`.

## Code Splitting

```tsx
import { lazy } from "react";

const Dashboard = lazy(() => import("./pages/dashboard"));

const router = createBrowserRouter([
    {
        path: "dashboard",
        element: (
            <Suspense fallback={<DashboardSkeleton />}>
                <Dashboard />
            </Suspense>
        ),
    },
]);
```

## Protected Routes

```tsx
function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

// Usage
<Route
    path="dashboard"
    element={
        <RequireAuth>
            <Dashboard />
        </RequireAuth>
    }
/>;
```

Or with loaders:

```tsx
function protectedLoader({ request }: LoaderFunctionArgs) {
    const user = getUser();
    if (!user) throw redirect("/login");
    return user;
}
```

## Scroll Restoration

```tsx
import { ScrollRestoration } from "react-router";

function Layout() {
    return (
        <>
            <Outlet />
            <ScrollRestoration />
        </>
    );
}
```

Place `ScrollRestoration` once in your root layout.
