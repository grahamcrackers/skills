# Observer

Observer defines a subscription mechanism to notify multiple objects about state changes. [Learn more](https://refactoring.guru/design-patterns/observer)

**Category:** Behavioral

## TypeScript Example

```typescript
/**
 * The Subject interface declares a set of methods for managing subscribers.
 */
interface Subject {
    // Attach an observer to the subject.
    attach(observer: Observer): void;

    // Detach an observer from the subject.
    detach(observer: Observer): void;

    // Notify all observers about an event.
    notify(): void;
}

/**
 * The Subject owns some important state and notifies observers when the state
 * changes.
 */
class ConcreteSubject implements Subject {
    /**
     * @type {number} For the sake of simplicity, the Subject's state, essential
     * to all subscribers, is stored in this variable.
     */
    public state: number;

    /**
     * @type {Observer[]} List of subscribers. In real life, the list of
     * subscribers can be stored more comprehensively (categorized by event
     * type, etc.).
     */
    private observers: Observer[] = [];

    /**
     * The subscription management methods.
     */
    public attach(observer: Observer): void {
        const isExist = this.observers.includes(observer);
        if (isExist) {
            return console.log("Subject: Observer has been attached already.");
        }

        console.log("Subject: Attached an observer.");
        this.observers.push(observer);
    }

    public detach(observer: Observer): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex === -1) {
            return console.log("Subject: Nonexistent observer.");
        }

        this.observers.splice(observerIndex, 1);
        console.log("Subject: Detached an observer.");
    }

    /**
     * Trigger an update in each subscriber.
     */
    public notify(): void {
        console.log("Subject: Notifying observers...");
        for (const observer of this.observers) {
            observer.update(this);
        }
    }

    /**
     * Usually, the subscription logic is only a fraction of what a Subject can
     * really do. Subjects commonly hold some important business logic, that
     * triggers a notification method whenever something important is about to
     * happen (or after it).
     */
    public someBusinessLogic(): void {
        console.log("\nSubject: I'm doing something important.");
        this.state = Math.floor(Math.random() * (10 + 1));

        console.log(`Subject: My state has just changed to: ${this.state}`);
        this.notify();
    }
}

/**
 * The Observer interface declares the update method, used by subjects.
 */
interface Observer {
    // Receive update from subject.
    update(subject: Subject): void;
}

/**
 * Concrete Observers react to the updates issued by the Subject they had been
 * attached to.
 */
class ConcreteObserverA implements Observer {
    public update(subject: Subject): void {
        if (subject instanceof ConcreteSubject && subject.state < 3) {
            console.log("ConcreteObserverA: Reacted to the event.");
        }
    }
}

class ConcreteObserverB implements Observer {
    public update(subject: Subject): void {
        if (subject instanceof ConcreteSubject && (subject.state === 0 || subject.state >= 2)) {
            console.log("ConcreteObserverB: Reacted to the event.");
        }
    }
}

/**
 * The client code.
 */

const subject = new ConcreteSubject();

const observer1 = new ConcreteObserverA();
subject.attach(observer1);

const observer2 = new ConcreteObserverB();
subject.attach(observer2);

subject.someBusinessLogic();
subject.someBusinessLogic();

subject.detach(observer2);

subject.someBusinessLogic();
```

### Output

```
Subject: Attached an observer.
Subject: Attached an observer.

Subject: I'm doing something important.
Subject: My state has just changed to: 6
Subject: Notifying observers...
ConcreteObserverB: Reacted to the event.

Subject: I'm doing something important.
Subject: My state has just changed to: 1
Subject: Notifying observers...
ConcreteObserverA: Reacted to the event.
Subject: Detached an observer.

Subject: I'm doing something important.
Subject: My state has just changed to: 5
Subject: Notifying observers...
```

## Also Known As

Event-Subscriber, Listener, Pub/Sub

## Real-World Example

An event bus for a React application where components subscribe to domain events (e.g., cart updated, user logged in) without direct coupling.

```typescript
type EventHandler<T = unknown> = (data: T) => void;

class EventBus {
    private listeners = new Map<string, Set<EventHandler>>();

    on<T>(event: string, handler: EventHandler<T>) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler as EventHandler);
        return () => this.off(event, handler);
    }

    off<T>(event: string, handler: EventHandler<T>) {
        this.listeners.get(event)?.delete(handler as EventHandler);
    }

    emit<T>(event: string, data: T) {
        this.listeners.get(event)?.forEach((handler) => handler(data));
    }
}

const bus = new EventBus();
const unsubscribe = bus.on<{ itemId: string }>("cart:updated", (data) => {
    console.log(`Cart updated: ${data.itemId}`);
});
bus.emit("cart:updated", { itemId: "abc-123" });
unsubscribe();
```

## When NOT to Use

- When there's only one subscriber — direct function calls are simpler
- When event chains become hard to trace and debug ("event spaghetti")
- When synchronous, direct communication between two known objects is clearer
- In React, prefer lifting state up or using Context over custom event buses for most UI state
