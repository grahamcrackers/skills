# Prototype

Prototype copies existing objects without coupling to their specific classes. Objects can clone themselves, including nested objects and circular references. [Learn more](https://refactoring.guru/design-patterns/prototype)

**Category:** Creational

## TypeScript Example

```typescript
/**
 * The example class that has cloning ability. We'll see how the values of field
 * with different types will be cloned.
 */
class Prototype {
    public primitive: any;
    public component: object;
    public circularReference: ComponentWithBackReference;

    public clone(): this {
        const clone = Object.create(this);

        clone.component = Object.create(this.component);

        // Cloning an object that has a nested object with backreference
        // requires special treatment. After the cloning is completed, the
        // nested object should point to the cloned object, instead of the
        // original object. Spread operator can be handy for this case.
        clone.circularReference = new ComponentWithBackReference(clone);

        return clone;
    }
}

class ComponentWithBackReference {
    public prototype;

    constructor(prototype: Prototype) {
        this.prototype = prototype;
    }
}

/**
 * The client code.
 */
function clientCode() {
    const p1 = new Prototype();
    p1.primitive = 245;
    p1.component = new Date();
    p1.circularReference = new ComponentWithBackReference(p1);

    const p2 = p1.clone();
    if (p1.primitive === p2.primitive) {
        console.log("Primitive field values have been carried over to a clone. Yay!");
    } else {
        console.log("Primitive field values have not been copied. Booo!");
    }
    if (p1.component === p2.component) {
        console.log("Simple component has not been cloned. Booo!");
    } else {
        console.log("Simple component has been cloned. Yay!");
    }

    if (p1.circularReference === p2.circularReference) {
        console.log("Component with back reference has not been cloned. Booo!");
    } else {
        console.log("Component with back reference has been cloned. Yay!");
    }

    if (p1.circularReference.prototype === p2.circularReference.prototype) {
        console.log("Component with back reference is linked to original object. Booo!");
    } else {
        console.log("Component with back reference is linked to the clone. Yay!");
    }
}

clientCode();
```

### Output

```
Primitive field values have been carried over to a clone. Yay!
Simple component has been cloned. Yay!
Component with back reference has been cloned. Yay!
Component with back reference is linked to the clone. Yay!
```

## Also Known As

Clone

## Real-World Example

A document editor where users can duplicate existing templates or pages. Cloning preserves all settings without re-configuring from scratch.

```typescript
interface Cloneable<T> {
    clone(): T;
}

class PageTemplate implements Cloneable<PageTemplate> {
    constructor(
        public title: string,
        public layout: string,
        public styles: Record<string, string>,
    ) {}

    clone(): PageTemplate {
        return new PageTemplate(this.title, this.layout, { ...this.styles });
    }
}

const blogTemplate = new PageTemplate("Blog Post", "single-column", { fontSize: "16px", color: "#333" });
const newPage = blogTemplate.clone();
newPage.title = "My First Post";
```

## When NOT to Use

- When objects are simple and cheap to create from scratch
- When deep cloning is complex (circular references, closures, DOM nodes)
- When object creation involves side effects (API calls, subscriptions) that shouldn't be duplicated
- In most frontend code, plain object spread (`{ ...obj }`) or `structuredClone()` is sufficient
