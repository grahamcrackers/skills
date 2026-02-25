# Chain of Responsibility

Chain of Responsibility passes requests along a chain of handlers until one handles it. [Learn more](https://refactoring.guru/design-patterns/chain-of-responsibility)

**Category:** Behavioral

## TypeScript Example

```typescript
/**
 * The Handler interface declares a method for building the chain of handlers.
 * It also declares a method for executing a request.
 */
interface Handler<Request = string, Result = string> {
    setNext(handler: Handler<Request, Result>): Handler<Request, Result>;

    handle(request: Request): Result;
}

/**
 * The default chaining behavior can be implemented inside a base handler class.
 */
abstract class AbstractHandler implements Handler {
    private nextHandler: Handler;

    public setNext(handler: Handler): Handler {
        this.nextHandler = handler;
        // Returning a handler from here will let us link handlers in a
        // convenient way like this:
        // monkey.setNext(squirrel).setNext(dog);
        return handler;
    }

    public handle(request: string): string {
        if (this.nextHandler) {
            return this.nextHandler.handle(request);
        }

        return null;
    }
}

/**
 * All Concrete Handlers either handle a request or pass it to the next handler
 * in the chain.
 */
class MonkeyHandler extends AbstractHandler {
    public handle(request: string): string {
        if (request === "Banana") {
            return `Monkey: I'll eat the ${request}.`;
        }
        return super.handle(request);
    }
}

class SquirrelHandler extends AbstractHandler {
    public handle(request: string): string {
        if (request === "Nut") {
            return `Squirrel: I'll eat the ${request}.`;
        }
        return super.handle(request);
    }
}

class DogHandler extends AbstractHandler {
    public handle(request: string): string {
        if (request === "MeatBall") {
            return `Dog: I'll eat the ${request}.`;
        }
        return super.handle(request);
    }
}

/**
 * The client code is usually suited to work with a single handler. In most
 * cases, it is not even aware that the handler is part of a chain.
 */
function clientCode(handler: Handler) {
    const foods = ["Nut", "Banana", "Cup of coffee"];

    for (const food of foods) {
        console.log(`Client: Who wants a ${food}?`);

        const result = handler.handle(food);
        if (result) {
            console.log(`  ${result}`);
        } else {
            console.log(`  ${food} was left untouched.`);
        }
    }
}

/**
 * The other part of the client code constructs the actual chain.
 */
const monkey = new MonkeyHandler();
const squirrel = new SquirrelHandler();
const dog = new DogHandler();

monkey.setNext(squirrel).setNext(dog);

/**
 * The client should be able to send a request to any handler, not just the
 * first one in the chain.
 */
console.log("Chain: Monkey > Squirrel > Dog\n");
clientCode(monkey);
console.log("");

console.log("Subchain: Squirrel > Dog\n");
clientCode(squirrel);
```

### Output

```
Chain: Monkey > Squirrel > Dog

Client: Who wants a Nut?
  Squirrel: I'll eat the Nut.
Client: Who wants a Banana?
  Monkey: I'll eat the Banana.
Client: Who wants a Cup of coffee?
  Cup of coffee was left untouched.

Subchain: Squirrel > Dog

Client: Who wants a Nut?
  Squirrel: I'll eat the Nut.
Client: Who wants a Banana?
  Banana was left untouched.
Client: Who wants a Cup of coffee?
  Cup of coffee was left untouched.
```

## Also Known As

CoR, Chain of Command

## Real-World Example

An HTTP middleware pipeline where each handler processes a request (auth, logging, rate limiting, validation) and decides whether to pass it to the next handler.

```typescript
interface Middleware {
    setNext(middleware: Middleware): Middleware;
    handle(request: Request): Response | null;
}

abstract class BaseMiddleware implements Middleware {
    private next: Middleware | null = null;

    setNext(middleware: Middleware): Middleware {
        this.next = middleware;
        return middleware;
    }

    handle(request: Request): Response | null {
        if (this.next) return this.next.handle(request);
        return null;
    }
}

class AuthMiddleware extends BaseMiddleware {
    handle(request: Request): Response | null {
        if (!request.headers.get("Authorization")) {
            return new Response("Unauthorized", { status: 401 });
        }
        return super.handle(request);
    }
}

class RateLimitMiddleware extends BaseMiddleware {
    private requests = 0;
    handle(request: Request): Response | null {
        if (this.requests++ > 100) {
            return new Response("Too Many Requests", { status: 429 });
        }
        return super.handle(request);
    }
}

const auth = new AuthMiddleware();
const rateLimit = new RateLimitMiddleware();
auth.setNext(rateLimit);
```

## When NOT to Use

- When every request must be handled by a specific handler (no "chain" needed)
- When the chain order is fragile and hard to reason about
- When a simple if/else or strategy pattern would be clearer
- When handlers have no fallthrough logic — they all need to run regardless
