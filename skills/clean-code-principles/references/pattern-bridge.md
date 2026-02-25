# Bridge

Bridge splits a large class into two hierarchies (abstraction and implementation) that can vary independently. [Learn more](https://refactoring.guru/design-patterns/bridge)

**Category:** Structural

## TypeScript Example

```typescript
/**
 * The Abstraction defines the interface for the "control" part of the two class
 * hierarchies. It maintains a reference to an object of the Implementation
 * hierarchy and delegates all of the real work to this object.
 */
class Abstraction {
    protected implementation: Implementation;

    constructor(implementation: Implementation) {
        this.implementation = implementation;
    }

    public operation(): string {
        const result = this.implementation.operationImplementation();
        return `Abstraction: Base operation with:\n${result}`;
    }
}

/**
 * You can extend the Abstraction without changing the Implementation classes.
 */
class ExtendedAbstraction extends Abstraction {
    public operation(): string {
        const result = this.implementation.operationImplementation();
        return `ExtendedAbstraction: Extended operation with:\n${result}`;
    }
}

/**
 * The Implementation defines the interface for all implementation classes. It
 * doesn't have to match the Abstraction's interface. In fact, the two
 * interfaces can be entirely different. Typically the Implementation interface
 * provides only primitive operations, while the Abstraction defines higher-
 * level operations based on those primitives.
 */
interface Implementation {
    operationImplementation(): string;
}

/**
 * Each Concrete Implementation corresponds to a specific platform and
 * implements the Implementation interface using that platform's API.
 */
class ConcreteImplementationA implements Implementation {
    public operationImplementation(): string {
        return "ConcreteImplementationA: Here's the result on the platform A.";
    }
}

class ConcreteImplementationB implements Implementation {
    public operationImplementation(): string {
        return "ConcreteImplementationB: Here's the result on the platform B.";
    }
}

/**
 * Except for the initialization phase, where an Abstraction object gets linked
 * with a specific Implementation object, the client code should only depend on
 * the Abstraction class. This way the client code can support any abstraction-
 * implementation combination.
 */
function clientCode(abstraction: Abstraction) {
    // ..

    console.log(abstraction.operation());

    // ..
}

/**
 * The client code should be able to work with any pre-configured abstraction-
 * implementation combination.
 */
let implementation = new ConcreteImplementationA();
let abstraction = new Abstraction(implementation);
clientCode(abstraction);

console.log("");

implementation = new ConcreteImplementationB();
abstraction = new ExtendedAbstraction(implementation);
clientCode(abstraction);
```

### Output

```
Abstraction: Base operation with:
ConcreteImplementationA: Here's the result on the platform A.

ExtendedAbstraction: Extended operation with:
ConcreteImplementationB: Here's the result on the platform B.
```

## Also Known As

Handle/Body

## Real-World Example

A notification system where the "what" (urgency level) is separated from the "how" (delivery channel). You can combine any urgency with any channel independently.

```typescript
interface MessageSender {
    send(message: string): void;
}

class SlackSender implements MessageSender {
    send(message: string) {
        console.log(`Slack: ${message}`);
    }
}

class EmailSender implements MessageSender {
    send(message: string) {
        console.log(`Email: ${message}`);
    }
}

abstract class Notification {
    constructor(protected sender: MessageSender) {}
    abstract notify(message: string): void;
}

class UrgentNotification extends Notification {
    notify(message: string) {
        this.sender.send(`[URGENT] ${message}`);
    }
}

class InfoNotification extends Notification {
    notify(message: string) {
        this.sender.send(`[INFO] ${message}`);
    }
}

// Mix and match
new UrgentNotification(new SlackSender()).notify("Server down!");
new InfoNotification(new EmailSender()).notify("Weekly report ready");
```

## When NOT to Use

- When there's only one dimension of variation (use simple inheritance instead)
- When the two hierarchies don't actually vary independently
- Adds indirection — avoid for simple cases where a single class hierarchy suffices
