# Builder

Builder constructs complex objects step by step, allowing different types and representations using the same construction process. [Learn more](https://refactoring.guru/design-patterns/builder)

**Category:** Creational

## TypeScript Example

```typescript
/**
 * The Builder interface specifies methods for creating the different parts of
 * the Product objects.
 */
interface Builder {
    producePartA(): void;
    producePartB(): void;
    producePartC(): void;
}

/**
 * The Concrete Builder classes follow the Builder interface and provide
 * specific implementations of the building steps. Your program may have several
 * variations of Builders, implemented differently.
 */
class ConcreteBuilder1 implements Builder {
    private product: Product1;

    /**
     * A fresh builder instance should contain a blank product object, which is
     * used in further assembly.
     */
    constructor() {
        this.reset();
    }

    public reset(): void {
        this.product = new Product1();
    }

    /**
     * All production steps work with the same product instance.
     */
    public producePartA(): void {
        this.product.parts.push("PartA1");
    }

    public producePartB(): void {
        this.product.parts.push("PartB1");
    }

    public producePartC(): void {
        this.product.parts.push("PartC1");
    }

    /**
     * Concrete Builders are supposed to provide their own methods for
     * retrieving results. That's because various types of builders may create
     * entirely different products that don't follow the same interface.
     * Therefore, such methods cannot be declared in the base Builder interface
     * (at least in a statically typed programming language).
     *
     * Usually, after returning the end result to the client, a builder instance
     * is expected to be ready to start producing another product. That's why
     * it's a usual practice to call the reset method at the end of the
     * `getProduct` method body. However, this behavior is not mandatory, and
     * you can make your builders wait for an explicit reset call from the
     * client code before disposing of the previous result.
     */
    public getProduct(): Product1 {
        const result = this.product;
        this.reset();
        return result;
    }
}

/**
 * It makes sense to use the Builder pattern only when your products are quite
 * complex and require extensive configuration.
 *
 * Unlike in other creational patterns, different concrete builders can produce
 * unrelated products. In other words, results of various builders may not
 * always follow the same interface.
 */
class Product1 {
    public parts: string[] = [];

    public listParts(): void {
        console.log(`Product parts: ${this.parts.join(", ")}\n`);
    }
}

/**
 * The Director is only responsible for executing the building steps in a
 * particular sequence. It is helpful when producing products according to a
 * specific order or configuration. Strictly speaking, the Director class is
 * optional, since the client can control builders directly.
 */
class Director {
    private builder: Builder;

    /**
     * The Director works with any builder instance that the client code passes
     * to it. This way, the client code may alter the final type of the newly
     * assembled product.
     */
    public setBuilder(builder: Builder): void {
        this.builder = builder;
    }

    /**
     * The Director can construct several product variations using the same
     * building steps.
     */
    public buildMinimalViableProduct(): void {
        this.builder.producePartA();
    }

    public buildFullFeaturedProduct(): void {
        this.builder.producePartA();
        this.builder.producePartB();
        this.builder.producePartC();
    }
}

/**
 * The client code creates a builder object, passes it to the director and then
 * initiates the construction process. The end result is retrieved from the
 * builder object.
 */
function clientCode(director: Director) {
    const builder = new ConcreteBuilder1();
    director.setBuilder(builder);

    console.log("Standard basic product:");
    director.buildMinimalViableProduct();
    builder.getProduct().listParts();

    console.log("Standard full featured product:");
    director.buildFullFeaturedProduct();
    builder.getProduct().listParts();

    // Remember, the Builder pattern can be used without a Director class.
    console.log("Custom product:");
    builder.producePartA();
    builder.producePartC();
    builder.getProduct().listParts();
}

const director = new Director();
clientCode(director);
```

### Output

```
Standard basic product:
Product parts: PartA1

Standard full featured product:
Product parts: PartA1, PartB1, PartC1

Custom product:
Product parts: PartA1, PartC1
```

## Also Known As

(no widely-used alternative names)

## Real-World Example

Building a complex API query with optional filters, pagination, sorting, and field selection. A `QueryBuilder` lets you chain methods to construct the query step by step.

```typescript
class QueryBuilder {
    private query: Record<string, unknown> = {};

    where(field: string, value: unknown) {
        this.query[field] = value;
        return this;
    }

    limit(n: number) {
        this.query._limit = n;
        return this;
    }

    sortBy(field: string, order: "asc" | "desc" = "asc") {
        this.query._sort = field;
        this.query._order = order;
        return this;
    }

    build(): string {
        return new URLSearchParams(Object.entries(this.query).map(([k, v]) => [k, String(v)])).toString();
    }
}

const query = new QueryBuilder()
    .where("status", "active")
    .where("role", "admin")
    .sortBy("createdAt", "desc")
    .limit(25)
    .build();
// "status=active&role=admin&_sort=createdAt&_order=desc&_limit=25"
```

## When NOT to Use

- When the object is simple with few properties (just use a constructor or object literal)
- When immutability is required and the builder mutates internal state
- When a plain options object `{ key: value }` would be clearer
