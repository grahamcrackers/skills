# Composite

Composite composes objects into tree structures, treating individual objects and compositions uniformly. [Learn more](https://refactoring.guru/design-patterns/composite)

**Category:** Structural

## TypeScript Example

```typescript
/**
 * The base Component class declares common operations for both simple and
 * complex objects of a composition.
 */
abstract class Component {
    protected parent!: Component | null;

    /**
     * Optionally, the base Component can declare an interface for setting and
     * accessing a parent of the component in a tree structure. It can also
     * provide some default implementation for these methods.
     */
    public setParent(parent: Component | null) {
        this.parent = parent;
    }

    public getParent(): Component | null {
        return this.parent;
    }

    /**
     * In some cases, it would be beneficial to define the child-management
     * operations right in the base Component class. This way, you won't need to
     * expose any concrete component classes to the client code, even during the
     * object tree assembly. The downside is that these methods will be empty
     * for the leaf-level components.
     */
    public add(component: Component): void {}

    public remove(component: Component): void {}

    /**
     * You can provide a method that lets the client code figure out whether a
     * component can bear children.
     */
    public isComposite(): boolean {
        return false;
    }

    /**
     * The base Component may implement some default behavior or leave it to
     * concrete classes (by declaring the method containing the behavior as
     * "abstract").
     */
    public abstract operation(): string;
}

/**
 * The Leaf class represents the end objects of a composition. A leaf can't have
 * any children.
 *
 * Usually, it's the Leaf objects that do the actual work, whereas Composite
 * objects only delegate to their sub-components.
 */
class Leaf extends Component {
    public operation(): string {
        return "Leaf";
    }
}

/**
 * The Composite class represents the complex components that may have children.
 * Usually, the Composite objects delegate the actual work to their children and
 * then "sum-up" the result.
 */
class Composite extends Component {
    protected children: Component[] = [];

    /**
     * A composite object can add or remove other components (both simple or
     * complex) to or from its child list.
     */
    public add(component: Component): void {
        this.children.push(component);
        component.setParent(this);
    }

    public remove(component: Component): void {
        const componentIndex = this.children.indexOf(component);
        this.children.splice(componentIndex, 1);

        component.setParent(null);
    }

    public isComposite(): boolean {
        return true;
    }

    /**
     * The Composite executes its primary logic in a particular way. It
     * traverses recursively through all its children, collecting and summing
     * their results. Since the composite's children pass these calls to their
     * children and so forth, the whole object tree is traversed as a result.
     */
    public operation(): string {
        const results = [];
        for (const child of this.children) {
            results.push(child.operation());
        }

        return `Branch(${results.join("+")})`;
    }
}

/**
 * The client code works with all of the components via the base interface.
 */
function clientCode(component: Component) {
    // ...

    console.log(`RESULT: ${component.operation()}`);

    // ...
}

/**
 * This way the client code can support the simple leaf components...
 */
const simple = new Leaf();
console.log("Client: I've got a simple component:");
clientCode(simple);
console.log("");

/**
 * ...as well as the complex composites.
 */
const tree = new Composite();
const branch1 = new Composite();
branch1.add(new Leaf());
branch1.add(new Leaf());
const branch2 = new Composite();
branch2.add(new Leaf());
tree.add(branch1);
tree.add(branch2);
console.log("Client: Now I've got a composite tree:");
clientCode(tree);
console.log("");

/**
 * Thanks to the fact that the child-management operations are declared in the
 * base Component class, the client code can work with any component, simple or
 * complex, without depending on their concrete classes.
 */
function clientCode2(component1: Component, component2: Component) {
    // ...

    if (component1.isComposite()) {
        component1.add(component2);
    }
    console.log(`RESULT: ${component1.operation()}`);

    // ...
}

console.log("Client: I don't need to check the components classes even when managing the tree:");
clientCode2(tree, simple);
```

### Output

```
Client: I've got a simple component:
RESULT: Leaf

Client: Now I've got a composite tree:
RESULT: Branch(Branch(Leaf+Leaf)+Branch(Leaf))

Client: I don't need to check the components classes even when managing the tree:
RESULT: Branch(Branch(Leaf+Leaf)+Branch(Leaf)+Leaf)
```

## Also Known As

Object Tree

## Real-World Example

A file explorer or menu system where folders contain files and other folders. Each node renders itself and its children recursively.

```typescript
interface FileSystemNode {
    getName(): string;
    getSize(): number;
}

class File implements FileSystemNode {
    constructor(
        private name: string,
        private size: number,
    ) {}
    getName() {
        return this.name;
    }
    getSize() {
        return this.size;
    }
}

class Folder implements FileSystemNode {
    private children: FileSystemNode[] = [];
    constructor(private name: string) {}
    getName() {
        return this.name;
    }
    add(node: FileSystemNode) {
        this.children.push(node);
    }
    getSize(): number {
        return this.children.reduce((sum, child) => sum + child.getSize(), 0);
    }
}

const root = new Folder("src");
const components = new Folder("components");
components.add(new File("Button.tsx", 1200));
components.add(new File("Modal.tsx", 2400));
root.add(components);
root.add(new File("index.ts", 150));
console.log(root.getSize()); // 3750
```

## When NOT to Use

- When the hierarchy is flat (no nesting) — just use an array
- When leaf and composite objects have very different interfaces
- When the tree can grow unboundedly and recursive operations become a performance concern
