# Strategy

Strategy defines a family of algorithms, encapsulates each one, and makes them interchangeable. [Learn more](https://refactoring.guru/design-patterns/strategy)

**Category:** Behavioral

## TypeScript Example

```typescript
/**
 * The Context defines the interface of interest to clients.
 */
class Context {
    /**
     * @type {Strategy} The Context maintains a reference to one of the Strategy
     * objects. The Context does not know the concrete class of a strategy. It
     * should work with all strategies via the Strategy interface.
     */
    private strategy: Strategy;

    /**
     * Usually, the Context accepts a strategy through the constructor, but also
     * provides a setter to change it at runtime.
     */
    constructor(strategy: Strategy) {
        this.strategy = strategy;
    }

    /**
     * Usually, the Context allows replacing a Strategy object at runtime.
     */
    public setStrategy(strategy: Strategy) {
        this.strategy = strategy;
    }

    /**
     * The Context delegates some work to the Strategy object instead of
     * implementing multiple versions of the algorithm on its own.
     */
    public doSomeBusinessLogic(): void {
        // ...

        console.log("Context: Sorting data using the strategy (not sure how it'll do it)");
        const result = this.strategy.doAlgorithm(["a", "b", "c", "d", "e"]);
        console.log(result.join(","));

        // ...
    }
}

/**
 * The Strategy interface declares operations common to all supported versions
 * of some algorithm.
 *
 * The Context uses this interface to call the algorithm defined by Concrete
 * Strategies.
 */
interface Strategy {
    doAlgorithm(data: string[]): string[];
}

/**
 * Concrete Strategies implement the algorithm while following the base Strategy
 * interface. The interface makes them interchangeable in the Context.
 */
class ConcreteStrategyA implements Strategy {
    public doAlgorithm(data: string[]): string[] {
        return data.sort();
    }
}

class ConcreteStrategyB implements Strategy {
    public doAlgorithm(data: string[]): string[] {
        return data.reverse();
    }
}

/**
 * The client code picks a concrete strategy and passes it to the context. The
 * client should be aware of the differences between strategies in order to make
 * the right choice.
 */
const context = new Context(new ConcreteStrategyA());
console.log("Client: Strategy is set to normal sorting.");
context.doSomeBusinessLogic();

console.log("");

console.log("Client: Strategy is set to reverse sorting.");
context.setStrategy(new ConcreteStrategyB());
context.doSomeBusinessLogic();
```

### Output

```
Client: Strategy is set to normal sorting.
Context: Sorting data using the strategy (not sure how it'll do it)
a,b,c,d,e

Client: Strategy is set to reverse sorting.
Context: Sorting data using the strategy (not sure how it'll do it)
e,d,c,b,a
```

## Also Known As

Policy

## Real-World Example

A payment processing system that supports multiple payment methods. The checkout component doesn't know which payment method is used — it just calls `pay()`.

```typescript
interface PaymentStrategy {
    pay(amount: number): void;
}

class CreditCardPayment implements PaymentStrategy {
    constructor(private cardNumber: string) {}
    pay(amount: number) {
        console.log(`Charged $${amount} to card ending ${this.cardNumber.slice(-4)}`);
    }
}

class PayPalPayment implements PaymentStrategy {
    constructor(private email: string) {}
    pay(amount: number) {
        console.log(`Charged $${amount} to PayPal ${this.email}`);
    }
}

class Checkout {
    constructor(private strategy: PaymentStrategy) {}
    setStrategy(strategy: PaymentStrategy) {
        this.strategy = strategy;
    }
    processPayment(amount: number) {
        this.strategy.pay(amount);
    }
}

const checkout = new Checkout(new CreditCardPayment("4111111111111111"));
checkout.processPayment(99.99);
```

## When NOT to Use

- When there's only one algorithm and no expectation of alternatives
- When the algorithm never changes at runtime — a simple function is enough
- When strategies share significant internal state (they become tightly coupled anyway)
- When a plain callback/function parameter would be simpler than a full interface
