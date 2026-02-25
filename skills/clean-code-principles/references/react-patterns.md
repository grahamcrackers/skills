# React Design Patterns

Patterns heavily used in React applications that don't exist in the classic GoF catalog.

## Compound Components

Multiple components that work together, sharing implicit state via Context. Consumers compose them freely without prop drilling.

```tsx
const TabsContext = createContext<{
    activeTab: string;
    setActiveTab: (id: string) => void;
} | null>(null);

function useTabs() {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error("Tab components must be used within <Tabs>");
    return ctx;
}

function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div role="tablist">{children}</div>
        </TabsContext.Provider>
    );
}

function Tab({ id, children }: { id: string; children: React.ReactNode }) {
    const { activeTab, setActiveTab } = useTabs();
    return (
        <button role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)}>
            {children}
        </button>
    );
}

function Panel({ id, children }: { id: string; children: React.ReactNode }) {
    const { activeTab } = useTabs();
    if (activeTab !== id) return null;
    return <div role="tabpanel">{children}</div>;
}

Tabs.Tab = Tab;
Tabs.Panel = Panel;

// Usage
<Tabs defaultTab="general">
    <Tabs.Tab id="general">General</Tabs.Tab>
    <Tabs.Tab id="security">Security</Tabs.Tab>
    <Tabs.Panel id="general">General settings...</Tabs.Panel>
    <Tabs.Panel id="security">Security settings...</Tabs.Panel>
</Tabs>;
```

**When to use:** Complex UI components with multiple cooperating parts (tabs, accordions, selects, menus, data tables).

## Render Props

Pass a function as a prop (or as `children`) to share logic while letting the consumer control rendering.

```tsx
function MouseTracker({ children }: { children: (pos: { x: number; y: number }) => React.ReactNode }) {
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: MouseEvent) => {
        setPos({ x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return <>{children(pos)}</>;
}

// Usage — consumer decides how to render
<MouseTracker>{({ x, y }) => <Tooltip style={{ left: x, top: y }}>Cursor here</Tooltip>}</MouseTracker>;
```

**When to use:** Sharing behavior while giving full rendering control. Largely replaced by custom hooks, but still useful for component-level rendering delegation (e.g., virtualized list `renderItem`).

## Custom Hook Pattern

Extract reusable stateful logic into `use*` functions. The most common React pattern for code reuse.

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
        const stored = localStorage.getItem(key);
        return stored ? (JSON.parse(stored) as T) : initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue] as const;
}

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [query]);

    return matches;
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
```

**When to use:** Any reusable logic involving state, effects, refs, or other hooks. Prefer over render props and HOCs for most use cases.

## Provider Pattern

Use React Context to inject dependencies (services, config, auth) deep into the component tree without prop drilling.

```tsx
type AuthContext = {
    user: User | null;
    login: (credentials: Credentials) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContext | null>(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const login = async (credentials: Credentials) => {
        const user = await authApi.login(credentials);
        setUser(user);
    };

    const logout = () => {
        authApi.logout();
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

// Compose providers at the app root
function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ThemeProvider>{children}</ThemeProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
```

**When to use:** Dependency injection (auth, theme, i18n, feature flags), global services, app-wide configuration. Keep providers close to where they're consumed — don't put everything at the root.

## Container / Presentational

Separate data concerns from UI rendering. The container handles data fetching and state; the presentational component is a pure function of props.

```tsx
// Container — handles data
function UserProfileContainer({ userId }: { userId: string }) {
    const { data: user, isLoading, error } = useUser(userId);

    if (isLoading) return <UserProfileSkeleton />;
    if (error) return <ErrorMessage error={error} />;
    if (!user) return null;

    return <UserProfileView user={user} />;
}

// Presentational — pure UI, easy to test and storybook
function UserProfileView({ user }: { user: User }) {
    return (
        <div className="profile">
            <Avatar src={user.avatar} alt={user.name} />
            <h2>{user.name}</h2>
            <p>{user.bio}</p>
        </div>
    );
}
```

**When to use:** When you want reusable, testable UI components. The presentational component can be used in Storybook, tested without mocks, and rendered with different data sources.

## Controlled / Uncontrolled Components

Controlled: parent owns the state. Uncontrolled: component manages its own state internally, with an optional default.

```tsx
type InputProps =
    | { value: string; onChange: (value: string) => void; defaultValue?: never }
    | { value?: never; onChange?: (value: string) => void; defaultValue?: string };

function SearchInput(props: InputProps) {
    const [internalValue, setInternalValue] = useState(props.defaultValue ?? "");

    const isControlled = props.value !== undefined;
    const value = isControlled ? props.value : internalValue;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (!isControlled) setInternalValue(next);
        props.onChange?.(next);
    };

    return <input value={value} onChange={handleChange} />;
}

// Controlled — parent owns state
const [query, setQuery] = useState("");
<SearchInput value={query} onChange={setQuery} />

// Uncontrolled — component owns state
<SearchInput defaultValue="initial" onChange={(v) => console.log(v)} />
```

**When to use:** Building reusable input/form components that need to work both ways. Libraries like React Aria, Radix, and Headless UI use this pattern extensively.

## Polymorphic Components

The `as` prop lets a component render as any HTML element or React component while preserving type safety.

```tsx
type PolymorphicProps<E extends React.ElementType> = {
    as?: E;
    children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, "as" | "children">;

function Text<E extends React.ElementType = "span">({ as, children, ...props }: PolymorphicProps<E>) {
    const Component = as || "span";
    return <Component {...props}>{children}</Component>;
}

// Renders as <span>
<Text>Hello</Text>

// Renders as <h1> with h1-specific props
<Text as="h1" id="title">Heading</Text>

// Renders as a Link component
<Text as={Link} to="/about">About</Text>
```

**When to use:** Design system primitives (Box, Text, Stack) that need to render as different HTML elements depending on context.

## Slot Pattern

Pass components as named props for flexible layout composition, as an alternative to `children`.

```tsx
type CardProps = {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
};

function Card({ header, footer, actions, children }: CardProps) {
    return (
        <div className="card">
            {header && <div className="card-header">{header}</div>}
            <div className="card-body">{children}</div>
            {actions && <div className="card-actions">{actions}</div>}
            {footer && <div className="card-footer">{footer}</div>}
        </div>
    );
}

// Usage — each slot is independently customizable
<Card header={<h3>User Profile</h3>} actions={<Button>Edit</Button>} footer={<span>Last updated: today</span>}>
    <p>Card body content here</p>
</Card>;
```

**When to use:** Layout components with multiple customizable regions. Clearer than deeply nested `children` when a component has distinct visual zones.

## State Reducer Pattern

Let consumers customize internal state transitions by passing a reducer that intercepts state changes.

```tsx
type ToggleState = { isOn: boolean };
type ToggleAction = { type: "toggle" } | { type: "reset" };

function defaultReducer(state: ToggleState, action: ToggleAction): ToggleState {
    switch (action.type) {
        case "toggle":
            return { isOn: !state.isOn };
        case "reset":
            return { isOn: false };
    }
}

function useToggle(reducer: typeof defaultReducer = defaultReducer) {
    const [state, dispatch] = useReducer(reducer, { isOn: false });
    const toggle = () => dispatch({ type: "toggle" });
    const reset = () => dispatch({ type: "reset" });
    return { ...state, toggle, reset };
}

// Consumer customizes behavior: can't toggle more than 4 times
function useLimitedToggle() {
    const [clickCount, setClickCount] = useState(0);

    return useToggle((state, action) => {
        if (action.type === "toggle" && clickCount >= 4) return state;
        setClickCount((c) => c + 1);
        return defaultReducer(state, action);
    });
}
```

**When to use:** Library components or hooks where consumers need to override or constrain default behavior (Downshift popularized this pattern).

## Forwarded Refs / Imperative Handle

Expose a limited imperative API to parent components using `ref` and `useImperativeHandle`.

```tsx
type InputHandle = {
    focus: () => void;
    clear: () => void;
    scrollIntoView: () => void;
};

const FancyInput = forwardRef<InputHandle, { label: string }>(function FancyInput({ label }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => {
            if (inputRef.current) inputRef.current.value = "";
        },
        scrollIntoView: () => inputRef.current?.scrollIntoView({ behavior: "smooth" }),
    }));

    return (
        <label>
            {label}
            <input ref={inputRef} />
        </label>
    );
});

// Parent can call imperative methods
const inputRef = useRef<InputHandle>(null);
<FancyInput ref={inputRef} label="Search" />
<button onClick={() => inputRef.current?.focus()}>Focus</button>
```

**When to use:** When declarative props aren't enough — focus management, scroll control, animation triggers, integrating with non-React libraries.

## Higher-Order Components (HOC)

A function that takes a component and returns an enhanced version. The class-era equivalent of custom hooks.

```tsx
function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function AuthenticatedComponent(props: P) {
        const { user } = useAuth();
        if (!user) return <Navigate to="/login" />;
        return <Component {...props} />;
    };
}

const ProtectedDashboard = withAuth(Dashboard);
```

**When to use:** Mostly replaced by custom hooks, but still useful for cross-cutting concerns like auth guards, error boundaries, analytics wrappers, and integration with class-based APIs. Prefer hooks when possible.

## Error Boundary Pattern

Declarative error catching in the component tree. Still requires a class component (no hook equivalent).

```tsx
class ErrorBoundary extends Component<
    { fallback: React.ReactNode; children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("Error caught by boundary:", error, info);
    }

    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

// Usage — wrap features independently
<ErrorBoundary fallback={<p>Something went wrong.</p>}>
    <Suspense fallback={<Skeleton />}>
        <Dashboard />
    </Suspense>
</ErrorBoundary>;
```

**When to use:** Every route and major feature should have its own boundary. Pair with `Suspense` for loading states.

## Optimistic Update Pattern

Update the UI immediately before the server confirms, then roll back on failure.

```tsx
function useOptimisticToggleLike(postId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.toggleLike(postId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["post", postId] });
            const previous = queryClient.getQueryData<Post>(["post", postId]);

            queryClient.setQueryData<Post>(["post", postId], (old) =>
                old ? { ...old, isLiked: !old.isLiked, likeCount: old.likeCount + (old.isLiked ? -1 : 1) } : old,
            );

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["post", postId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["post", postId] });
        },
    });
}
```

**When to use:** Likes, bookmarks, toggles, drag-and-drop reorder — any action where the server will almost certainly succeed and the user expects instant feedback.

## Portal Pattern

Render children outside the parent DOM hierarchy while preserving React context and event bubbling.

```tsx
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body,
    );
}
```

**When to use:** Modals, tooltips, popovers, toasts, dropdown menus — anything that needs to visually escape its parent's `overflow: hidden` or `z-index` stacking context.
