---
name: state-machines
description: XState v5 patterns for state machines and statecharts in React including machine design, actors, guards, actions, services, parallel states, and React integration. Use when modeling complex UI state, building multi-step flows, managing async processes, or when the user asks about state machines, XState, statecharts, or finite state automata.
---

# State Machines with XState v5

## When to Use State Machines

Use state machines for complex state that has:

- **Multiple distinct states** (idle, loading, error, success).
- **Guarded transitions** (can only submit if form is valid).
- **Sequences** (multi-step wizards, onboarding flows).
- **Parallel concerns** (loading data + playing animation simultaneously).

Don't use for simple toggles or value-tracking — `useState` is fine for those.

## Setup

```shell
npm install xstate @xstate/react
```

Requires TypeScript 5.0+ and `strictNullChecks: true`.

## Basic Machine

```typescript
import { setup, assign } from "xstate";

const toggleMachine = setup({
    types: {
        context: {} as { count: number },
        events: {} as { type: "TOGGLE" } | { type: "RESET" },
    },
}).createMachine({
    id: "toggle",
    initial: "inactive",
    context: { count: 0 },
    states: {
        inactive: {
            on: {
                TOGGLE: {
                    target: "active",
                    actions: assign({ count: ({ context }) => context.count + 1 }),
                },
            },
        },
        active: {
            on: {
                TOGGLE: { target: "inactive" },
                RESET: {
                    target: "inactive",
                    actions: assign({ count: 0 }),
                },
            },
        },
    },
});
```

## React Integration

### `useMachine`

```tsx
import { useMachine } from "@xstate/react";

function Toggle() {
    const [state, send] = useMachine(toggleMachine);

    return (
        <div>
            <p>State: {state.value}</p>
            <p>Count: {state.context.count}</p>
            <button onClick={() => send({ type: "TOGGLE" })}>Toggle</button>
            {state.matches("active") && <button onClick={() => send({ type: "RESET" })}>Reset</button>}
        </div>
    );
}
```

### `useActor` with Global Actors

```typescript
import { createActor } from "xstate";

export const toggleActor = createActor(toggleMachine).start();
```

```tsx
import { useSelector } from "@xstate/react";
import { toggleActor } from "./machines/toggle";

function ToggleStatus() {
    const count = useSelector(toggleActor, (state) => state.context.count);
    const isActive = useSelector(toggleActor, (state) => state.matches("active"));

    return (
        <p>
            {isActive ? "Active" : "Inactive"} ({count})
        </p>
    );
}
```

Use `useSelector` for performance — it only re-renders when the selected value changes.

## Fetch Machine Pattern

```typescript
const fetchMachine = setup({
    types: {
        context: {} as {
            data: unknown | null;
            error: string | null;
        },
        events: {} as { type: "FETCH"; url: string } | { type: "RETRY" },
        input: {} as { url: string },
    },
    actors: {
        fetchData: fromPromise(async ({ input }: { input: { url: string } }) => {
            const response = await fetch(input.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        }),
    },
}).createMachine({
    id: "fetch",
    initial: "idle",
    context: { data: null, error: null },
    states: {
        idle: {
            on: { FETCH: "loading" },
        },
        loading: {
            invoke: {
                src: "fetchData",
                input: ({ event }) => ({ url: event.url }),
                onDone: {
                    target: "success",
                    actions: assign({ data: ({ event }) => event.output }),
                },
                onError: {
                    target: "failure",
                    actions: assign({ error: ({ event }) => event.error.message }),
                },
            },
        },
        success: {
            on: { FETCH: "loading" },
        },
        failure: {
            on: {
                RETRY: "loading",
                FETCH: "loading",
            },
        },
    },
});
```

## Guards

Conditional transitions:

```typescript
const machine = setup({
    types: {
        context: {} as { attempts: number; maxAttempts: number },
        events: {} as { type: "RETRY" },
    },
    guards: {
        canRetry: ({ context }) => context.attempts < context.maxAttempts,
        hasExceededMax: ({ context }) => context.attempts >= context.maxAttempts,
    },
}).createMachine({
    // ...
    states: {
        failure: {
            on: {
                RETRY: [
                    { target: "loading", guard: "canRetry" },
                    { target: "exhausted", guard: "hasExceededMax" },
                ],
            },
        },
    },
});
```

## Actions

Side effects on transitions:

```typescript
const machine = setup({
    types: {
        context: {} as { notifications: string[] },
        events: {} as { type: "SUBMIT"; data: FormData },
    },
    actions: {
        showToast: ({ context, event }) => {
            toast.success("Submitted successfully");
        },
        logEvent: ({ context, event }) => {
            analytics.track("form_submitted");
        },
        clearForm: assign({ notifications: [] }),
    },
}).createMachine({
    // ...
    states: {
        submitting: {
            invoke: {
                src: "submitForm",
                onDone: {
                    target: "success",
                    actions: ["showToast", "logEvent", "clearForm"],
                },
            },
        },
    },
});
```

## Nested (Hierarchical) States

Group related states:

```typescript
states: {
  authenticated: {
    initial: "idle",
    states: {
      idle: {
        on: { LOAD_PROFILE: "loadingProfile" },
      },
      loadingProfile: {
        invoke: {
          src: "fetchProfile",
          onDone: "profileLoaded",
          onError: "profileError",
        },
      },
      profileLoaded: {},
      profileError: {
        on: { RETRY: "loadingProfile" },
      },
    },
    on: {
      LOGOUT: "#app.unauthenticated", // transition to top-level state
    },
  },
  unauthenticated: {
    on: { LOGIN: "authenticated" },
  },
},
```

## Parallel States

Multiple independent state regions active simultaneously:

```typescript
type: "parallel",
states: {
  upload: {
    initial: "idle",
    states: {
      idle: { on: { START_UPLOAD: "uploading" } },
      uploading: { on: { UPLOAD_DONE: "complete" } },
      complete: {},
    },
  },
  validation: {
    initial: "idle",
    states: {
      idle: { on: { VALIDATE: "validating" } },
      validating: { on: { VALID: "valid", INVALID: "invalid" } },
      valid: {},
      invalid: {},
    },
  },
},
```

Check parallel state with: `state.matches({ upload: "complete", validation: "valid" })`.

## Multi-Step Form Example

```typescript
const formMachine = setup({
    types: {
        context: {} as {
            personalInfo: PersonalInfo | null;
            address: Address | null;
            payment: Payment | null;
        },
        events: {} as { type: "NEXT"; data: Record<string, unknown> } | { type: "BACK" } | { type: "SUBMIT" },
    },
}).createMachine({
    id: "checkout",
    initial: "personalInfo",
    context: { personalInfo: null, address: null, payment: null },
    states: {
        personalInfo: {
            on: {
                NEXT: {
                    target: "address",
                    actions: assign({ personalInfo: ({ event }) => event.data }),
                },
            },
        },
        address: {
            on: {
                NEXT: {
                    target: "payment",
                    actions: assign({ address: ({ event }) => event.data }),
                },
                BACK: "personalInfo",
            },
        },
        payment: {
            on: {
                NEXT: {
                    target: "review",
                    actions: assign({ payment: ({ event }) => event.data }),
                },
                BACK: "address",
            },
        },
        review: {
            on: {
                SUBMIT: "submitting",
                BACK: "payment",
            },
        },
        submitting: {
            invoke: {
                src: "submitOrder",
                onDone: "success",
                onError: "failure",
            },
        },
        success: { type: "final" },
        failure: {
            on: { RETRY: "submitting", BACK: "review" },
        },
    },
});
```

## Input (Machine Parameters)

Pass data to machines at creation time:

```typescript
const machine = setup({
    types: {
        input: {} as { userId: string },
        context: {} as { userId: string; user: User | null },
    },
}).createMachine({
    context: ({ input }) => ({
        userId: input.userId,
        user: null,
    }),
    // ...
});

// In React
const [state, send] = useMachine(machine, { input: { userId: "123" } });
```

## Visualizing Machines

Use the Stately visual editor to design and debug machines:

```shell
npx stately viz
```

Or visit [stately.ai/editor](https://stately.ai/editor) to paste your machine code and visualize the statechart.

## Guidelines

- **Model states explicitly** — if you can name it (idle, loading, error, success), it's a state, not a boolean.
- **Events describe what happened**, not what should happen: `"FORM_SUBMITTED"` not `"SUBMIT_FORM"`.
- **Keep machines focused** — one machine per concern. Compose with actors for complex systems.
- **Use guards** instead of if/else in actions — transitions are the decision points.
- **Test machines without React** — machines are pure logic and can be tested by sending events and asserting state.
