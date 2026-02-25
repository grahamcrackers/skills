# Singleton

Singleton ensures a class has only one instance with a global access point. The constructor is private; clients obtain the instance via a static getter. [Learn more](https://refactoring.guru/design-patterns/singleton)

**Category:** Creational

## TypeScript Example

```typescript
/**
 * The Singleton class defines an `instance` getter, that lets clients access
 * the unique singleton instance.
 */
class Singleton {
    static #instance: Singleton;

    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() {}

    /**
     * The static getter that controls access to the singleton instance.
     *
     * This implementation allows you to extend the Singleton class while
     * keeping just one instance of each subclass around.
     */
    public static get instance(): Singleton {
        if (!Singleton.#instance) {
            Singleton.#instance = new Singleton();
        }

        return Singleton.#instance;
    }

    /**
     * Finally, any singleton can define some business logic, which can be
     * executed on its instance.
     */
    public someBusinessLogic() {
        // ...
    }
}

/**
 * The client code.
 */
function clientCode() {
    const s1 = Singleton.instance;
    const s2 = Singleton.instance;

    if (s1 === s2) {
        console.log("Singleton works, both variables contain the same instance.");
    } else {
        console.log("Singleton failed, variables contain different instances.");
    }
}

clientCode();
```

### Output

```
Singleton works, both variables contain the same instance.
```

## Also Known As

(no widely-used alternative names)

## Real-World Example

A logger service or an API client instance that should be shared across the entire application.

```typescript
class ApiClient {
    private static instance: ApiClient;
    private baseUrl: string;

    private constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    static getInstance(baseUrl = "/api"): ApiClient {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient(baseUrl);
        }
        return ApiClient.instance;
    }

    async get<T>(path: string): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`);
        return res.json();
    }
}

// Same instance everywhere
const api = ApiClient.getInstance();
```

## When NOT to Use

- Widely considered an anti-pattern — makes testing difficult (hard to mock/replace)
- When you need multiple instances in tests or different configurations
- In frontend apps, prefer module-scoped instances or dependency injection via Context/providers
- Introduces hidden global state and tight coupling
- When the "single instance" requirement can be satisfied by ES module scope (modules are singletons by default in JS)
