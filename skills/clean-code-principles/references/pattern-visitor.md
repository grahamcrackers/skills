# Visitor

Visitor separates algorithms from the objects they operate on. [Learn more](https://refactoring.guru/design-patterns/visitor)

**Category:** Behavioral

## TypeScript Example

```typescript
/**
 * The Component interface declares an `accept` method that should take the base
 * visitor interface as an argument.
 */
interface Component {
    accept(visitor: Visitor): void;
}

/**
 * Each Concrete Component must implement the `accept` method in such a way that
 * it calls the visitor's method corresponding to the component's class.
 */
class ConcreteComponentA implements Component {
    /**
     * Note that we're calling `visitConcreteComponentA`, which matches the
     * current class name. This way we let the visitor know the class of the
     * component it works with.
     */
    public accept(visitor: Visitor): void {
        visitor.visitConcreteComponentA(this);
    }

    /**
     * Concrete Components may have special methods that don't exist in their
     * base class or interface. The Visitor is still able to use these methods
     * since it's aware of the component's concrete class.
     */
    public exclusiveMethodOfConcreteComponentA(): string {
        return "A";
    }
}

class ConcreteComponentB implements Component {
    /**
     * Same here: visitConcreteComponentB => ConcreteComponentB
     */
    public accept(visitor: Visitor): void {
        visitor.visitConcreteComponentB(this);
    }

    public specialMethodOfConcreteComponentB(): string {
        return "B";
    }
}

/**
 * The Visitor Interface declares a set of visiting methods that correspond to
 * component classes. The signature of a visiting method allows the visitor to
 * identify the exact class of the component that it's dealing with.
 */
interface Visitor {
    visitConcreteComponentA(element: ConcreteComponentA): void;

    visitConcreteComponentB(element: ConcreteComponentB): void;
}

/**
 * Concrete Visitors implement several versions of the same algorithm, which can
 * work with all concrete component classes.
 *
 * You can experience the biggest benefit of the Visitor pattern when using it
 * with a complex object structure, such as a Composite tree. In this case, it
 * might be helpful to store some intermediate state of the algorithm while
 * executing visitor's methods over various objects of the structure.
 */
class ConcreteVisitor1 implements Visitor {
    public visitConcreteComponentA(element: ConcreteComponentA): void {
        console.log(`${element.exclusiveMethodOfConcreteComponentA()} + ConcreteVisitor1`);
    }

    public visitConcreteComponentB(element: ConcreteComponentB): void {
        console.log(`${element.specialMethodOfConcreteComponentB()} + ConcreteVisitor1`);
    }
}

class ConcreteVisitor2 implements Visitor {
    public visitConcreteComponentA(element: ConcreteComponentA): void {
        console.log(`${element.exclusiveMethodOfConcreteComponentA()} + ConcreteVisitor2`);
    }

    public visitConcreteComponentB(element: ConcreteComponentB): void {
        console.log(`${element.specialMethodOfConcreteComponentB()} + ConcreteVisitor2`);
    }
}

/**
 * The client code can run visitor operations over any set of elements without
 * figuring out their concrete classes. The accept operation directs a call to
 * the appropriate operation in the visitor object.
 */
function clientCode(components: Component[], visitor: Visitor) {
    // ...
    for (const component of components) {
        component.accept(visitor);
    }
    // ...
}

const components = [new ConcreteComponentA(), new ConcreteComponentB()];

console.log("The client code works with all visitors via the base Visitor interface:");
const visitor1 = new ConcreteVisitor1();
clientCode(components, visitor1);
console.log("");

console.log("It allows the same client code to work with different types of visitors:");
const visitor2 = new ConcreteVisitor2();
clientCode(components, visitor2);
```

### Output

```
The client code works with all visitors via the base Visitor interface:
A + ConcreteVisitor1
B + ConcreteVisitor1

It allows the same client code to work with different types of visitors:
A + ConcreteVisitor2
B + ConcreteVisitor2
```

## Also Known As

None widely used

## Real-World Example

An AST (Abstract Syntax Tree) processor where different visitors perform different operations (type checking, code generation, optimization) on the same tree structure.

```typescript
interface ASTNode {
    accept(visitor: ASTVisitor): string;
}

class NumberNode implements ASTNode {
    constructor(public value: number) {}
    accept(visitor: ASTVisitor) {
        return visitor.visitNumber(this);
    }
}

class BinaryOpNode implements ASTNode {
    constructor(
        public op: string,
        public left: ASTNode,
        public right: ASTNode,
    ) {}
    accept(visitor: ASTVisitor) {
        return visitor.visitBinaryOp(this);
    }
}

interface ASTVisitor {
    visitNumber(node: NumberNode): string;
    visitBinaryOp(node: BinaryOpNode): string;
}

class PrintVisitor implements ASTVisitor {
    visitNumber(node: NumberNode) {
        return String(node.value);
    }
    visitBinaryOp(node: BinaryOpNode) {
        return `(${node.left.accept(this)} ${node.op} ${node.right.accept(this)})`;
    }
}

const tree = new BinaryOpNode("+", new NumberNode(1), new NumberNode(2));
console.log(tree.accept(new PrintVisitor())); // "(1 + 2)"
```

## When NOT to Use

- When the node hierarchy changes frequently — adding a new node type requires updating every visitor
- When there are few operations on the structure — just add methods to the nodes
- Adds significant complexity; avoid unless you have a stable class hierarchy with many cross-cutting operations
- Rarely needed in frontend/React applications
