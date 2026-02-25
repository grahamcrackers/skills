# Template Method

Template Method defines an algorithm skeleton, letting subclasses override specific steps. [Learn more](https://refactoring.guru/design-patterns/template-method)

**Category:** Behavioral

## TypeScript Example

```typescript
/**
 * The Abstract Class defines a template method that contains a skeleton of some
 * algorithm, composed of calls to (usually) abstract primitive operations.
 *
 * Concrete subclasses should implement these operations, but leave the template
 * method itself intact.
 */
abstract class AbstractClass {
    /**
     * The template method defines the skeleton of an algorithm.
     */
    public templateMethod(): void {
        this.baseOperation1();
        this.requiredOperations1();
        this.baseOperation2();
        this.hook1();
        this.requiredOperation2();
        this.baseOperation3();
        this.hook2();
    }

    /**
     * These operations already have implementations.
     */
    protected baseOperation1(): void {
        console.log("AbstractClass says: I am doing the bulk of the work");
    }

    protected baseOperation2(): void {
        console.log("AbstractClass says: But I let subclasses override some operations");
    }

    protected baseOperation3(): void {
        console.log("AbstractClass says: But I am doing the bulk of the work anyway");
    }

    /**
     * These operations have to be implemented in subclasses.
     */
    protected abstract requiredOperations1(): void;

    protected abstract requiredOperation2(): void;

    /**
     * These are "hooks." Subclasses may override them, but it's not mandatory
     * since the hooks already have default (but empty) implementation. Hooks
     * provide additional extension points in some crucial places of the
     * algorithm.
     */
    protected hook1(): void {}

    protected hook2(): void {}
}

/**
 * Concrete classes have to implement all abstract operations of the base class.
 * They can also override some operations with a default implementation.
 */
class ConcreteClass1 extends AbstractClass {
    protected requiredOperations1(): void {
        console.log("ConcreteClass1 says: Implemented Operation1");
    }

    protected requiredOperation2(): void {
        console.log("ConcreteClass1 says: Implemented Operation2");
    }
}

/**
 * Usually, concrete classes override only a fraction of base class' operations.
 */
class ConcreteClass2 extends AbstractClass {
    protected requiredOperations1(): void {
        console.log("ConcreteClass2 says: Implemented Operation1");
    }

    protected requiredOperation2(): void {
        console.log("ConcreteClass2 says: Implemented Operation2");
    }

    protected hook1(): void {
        console.log("ConcreteClass2 says: Overridden Hook1");
    }
}

/**
 * The client code calls the template method to execute the algorithm. Client
 * code does not have to know the concrete class of an object it works with, as
 * long as it works with objects through the interface of their base class.
 */
function clientCode(abstractClass: AbstractClass) {
    // ...
    abstractClass.templateMethod();
    // ...
}

console.log("Same client code can work with different subclasses:");
clientCode(new ConcreteClass1());
console.log("");

console.log("Same client code can work with different subclasses:");
clientCode(new ConcreteClass2());
```

### Output

```
Same client code can work with different subclasses:
AbstractClass says: I am doing the bulk of the work
ConcreteClass1 says: Implemented Operation1
AbstractClass says: But I let subclasses override some operations
ConcreteClass1 says: Implemented Operation2
AbstractClass says: But I am doing the bulk of the work anyway

Same client code can work with different subclasses:
AbstractClass says: I am doing the bulk of the work
ConcreteClass2 says: Implemented Operation1
AbstractClass says: But I let subclasses override some operations
ConcreteClass2 says: Overridden Hook1
ConcreteClass2 says: Implemented Operation2
AbstractClass says: But I am doing the bulk of the work anyway
```

## Also Known As

None widely used

## Real-World Example

A data export system where the overall flow (fetch → transform → format → output) is fixed, but subclasses customize the format step (CSV, JSON, XML).

```typescript
abstract class DataExporter {
    export() {
        const data = this.fetchData();
        const transformed = this.transform(data);
        const formatted = this.format(transformed);
        this.output(formatted);
    }

    private fetchData() {
        return [{ name: "Alice" }, { name: "Bob" }];
    }
    private transform(data: any[]) {
        return data.filter(Boolean);
    }

    protected abstract format(data: any[]): string;

    private output(content: string) {
        console.log(content);
    }
}

class CsvExporter extends DataExporter {
    protected format(data: any[]): string {
        return ["name", ...data.map((d) => d.name)].join("\n");
    }
}

class JsonExporter extends DataExporter {
    protected format(data: any[]): string {
        return JSON.stringify(data, null, 2);
    }
}

new CsvExporter().export();
new JsonExporter().export();
```

## When NOT to Use

- When the algorithm doesn't have a fixed skeleton — if steps vary widely, use Strategy instead
- When inheritance hierarchies become deep and rigid
- In functional codebases, passing functions as parameters (strategy/callback) is often simpler
- When subclasses need to change the order of steps, not just individual step implementations
