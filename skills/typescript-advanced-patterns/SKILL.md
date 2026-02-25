---
name: typescript-advanced-patterns
description: Advanced TypeScript type-level patterns including generics, branded types, discriminated unions, template literals, conditional types, and type-safe builders. Use when working on complex TypeScript type design, creating type-safe APIs, building libraries, or when the user asks about advanced type patterns.
---

# TypeScript Advanced Patterns

## Discriminated Unions

Model state machines and mutually exclusive variants with a shared literal discriminant:

```typescript
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

function handle(result: Result<User>) {
    if (result.success) {
        console.log(result.data.name); // narrowed to { data: User }
    } else {
        console.error(result.error); // narrowed to { error: Error }
    }
}
```

Prefer discriminated unions over optional fields when states are mutually exclusive.

## Branded / Nominal Types

Prevent accidental value interchange between structurally identical types:

```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

function getUser(id: UserId): User {
    /* ... */
}

const userId = "abc" as UserId;
const orderId = "abc" as OrderId;
getUser(orderId); // Type error
```

Use branded types for IDs, validated strings, currency amounts, and other domain primitives.

## Template Literal Types

Build type-safe string patterns:

```typescript
type EventName = `on${Capitalize<string>}`;
type CSSUnit = `${number}${"px" | "rem" | "em" | "%"}`;
type Route = `/${string}`;
```

Combine with mapped types for type-safe event handlers, CSS-in-JS, or API routes.

## Conditional Types

Derive types based on conditions:

```typescript
type IsArray<T> = T extends readonly unknown[] ? true : false;

type Unwrap<T> = T extends Promise<infer U> ? Unwrap<U> : T extends readonly (infer U)[] ? U : T;
```

Use `infer` to extract inner types. Keep conditional types shallow — deeply nested conditionals become unreadable.

## Mapped Types with Key Remapping

Transform object types:

```typescript
type Getters<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

## Type-Safe Builder Pattern

Chain methods while accumulating type information:

```typescript
class QueryBuilder<T extends Record<string, unknown>> {
    select<K extends keyof T>(...keys: K[]): QueryBuilder<Pick<T, K>> {
        return this as unknown as QueryBuilder<Pick<T, K>>;
    }

    where<K extends keyof T>(key: K, value: T[K]): QueryBuilder<T> {
        return this;
    }
}
```

## Exhaustive Pattern Matching

Ensure all union variants are handled at compile time:

```typescript
function assertNever(value: never): never {
    throw new Error(`Unhandled value: ${value}`);
}

function handleStatus(status: Status) {
    switch (status) {
        case "active":
            return "Active";
        case "inactive":
            return "Inactive";
        default:
            return assertNever(status); // compile error if a variant is missed
    }
}
```

## Function Overloads

Provide precise signatures for functions with varying input/output types:

```typescript
function parse(input: string): Document;
function parse(input: Buffer): Document;
function parse(input: string | Buffer): Document {
    // implementation
}
```

Prefer discriminated union parameters or generics over overloads when possible — overloads add complexity.

## const Type Parameters

Preserve literal types through generic functions (TypeScript 5.0+):

```typescript
function createRoutes<const T extends readonly string[]>(routes: T): T {
    return routes;
}

const routes = createRoutes(["/home", "/about"]); // readonly ["/home", "/about"]
```

## Type-Safe Record Factories

Constrain records to specific key sets:

```typescript
function createLookup<K extends string, V>(keys: readonly K[], valueFn: (key: K) => V): Record<K, V> {
    return Object.fromEntries(keys.map((k) => [k, valueFn(k)])) as Record<K, V>;
}
```

## Module Augmentation

Extend third-party types without forking:

```typescript
declare module "express" {
    interface Request {
        user?: AuthenticatedUser;
    }
}
```

Keep augmentations in a dedicated `*.d.ts` file and reference it in `tsconfig.json`.

## Guidelines

- Favor readability over cleverness — if a type requires a paragraph to explain, simplify it.
- Test complex types with `Expect` / `Equal` utilities (e.g., from `type-testing` or `expect-type`).
- Document non-obvious type-level logic with a brief comment above the type.
- Avoid recursive types deeper than 3-4 levels — they can crash the compiler or produce cryptic errors.
