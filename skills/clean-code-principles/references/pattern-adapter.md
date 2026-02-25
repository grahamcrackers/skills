# Adapter

Adapter makes incompatible interfaces work together by wrapping one to match the other. [Learn more](https://refactoring.guru/design-patterns/adapter)

**Category:** Structural

## TypeScript Example

```typescript
/**
 * The Target defines the domain-specific interface used by the client code.
 */
class Target {
    public request(): string {
        return "Target: The default target's behavior.";
    }
}

/**
 * The Adaptee contains some useful behavior, but its interface is incompatible
 * with the existing client code. The Adaptee needs some adaptation before the
 * client code can use it.
 */
class Adaptee {
    public specificRequest(): string {
        return ".eetpadA eht fo roivaheb laicepS";
    }
}

/**
 * The Adapter makes the Adaptee's interface compatible with the Target's
 * interface.
 */
class Adapter extends Target {
    private adaptee: Adaptee;

    constructor(adaptee: Adaptee) {
        super();
        this.adaptee = adaptee;
    }

    public request(): string {
        const result = this.adaptee.specificRequest().split("").reverse().join("");
        return `Adapter: (TRANSLATED) ${result}`;
    }
}

/**
 * The client code supports all classes that follow the Target interface.
 */
function clientCode(target: Target) {
    console.log(target.request());
}

console.log("Client: I can work just fine with the Target objects:");
const target = new Target();
clientCode(target);

console.log("");

const adaptee = new Adaptee();
console.log("Client: The Adaptee class has a weird interface. See, I don't understand it:");
console.log(`Adaptee: ${adaptee.specificRequest()}`);

console.log("");

console.log("Client: But I can work with it via the Adapter:");
const adapter = new Adapter(adaptee);
clientCode(adapter);
```

### Output

```
Client: I can work just fine with the Target objects:
Target: The default target's behavior.

Client: The Adaptee class has a weird interface. See, I don't understand it:
Adaptee: .eetpadA eht fo roivaheb laicepS

Client: But I can work with it via the Adapter:
Adapter: (TRANSLATED) Special behavior of the Adaptee.
```

## Also Known As

Wrapper

## Real-World Example

Wrapping a third-party analytics library to match your app's tracking interface, so you can swap providers without changing application code.

```typescript
interface AnalyticsTracker {
    track(event: string, data: Record<string, unknown>): void;
}

// Third-party SDK with a different API
class MixpanelSDK {
    send(eventName: string, properties: object) {
        console.log(`Mixpanel: ${eventName}`, properties);
    }
}

class MixpanelAdapter implements AnalyticsTracker {
    constructor(private sdk: MixpanelSDK) {}

    track(event: string, data: Record<string, unknown>) {
        this.sdk.send(event, data);
    }
}

const tracker: AnalyticsTracker = new MixpanelAdapter(new MixpanelSDK());
tracker.track("page_view", { path: "/home" });
```

## When NOT to Use

- When you control both interfaces and can just refactor one to match the other
- When the adaptation is trivial (a one-liner wrapper function is simpler)
- When it hides too much complexity — the abstraction may leak
