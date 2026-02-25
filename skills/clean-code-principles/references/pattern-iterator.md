# Iterator

Iterator traverses a collection without exposing its internal representation. [Learn more](https://refactoring.guru/design-patterns/iterator)

**Category:** Behavioral

## TypeScript Example

```typescript
/**
 * Iterator Design Pattern
 *
 * Intent: Lets you traverse elements of a collection without exposing its
 * underlying representation (list, stack, tree, etc.).
 */

interface Iterator<T> {
    // Return the current element.
    current(): T;

    // Return the current element and move forward to next element.
    next(): T;

    // Return the key of the current element.
    key(): number;

    // Checks if current position is valid.
    valid(): boolean;

    // Rewind the Iterator to the first element.
    rewind(): void;
}

interface Aggregator {
    // Retrieve an external iterator.
    getIterator(): Iterator<string>;
}

/**
 * Concrete Iterators implement various traversal algorithms. These classes
 * store the current traversal position at all times.
 */

class AlphabeticalOrderIterator implements Iterator<string> {
    private collection: WordsCollection;

    /**
     * Stores the current traversal position. An iterator may have a lot of
     * other fields for storing iteration state, especially when it is supposed
     * to work with a particular kind of collection.
     */
    private position: number = 0;

    /**
     * This variable indicates the traversal direction.
     */
    private reverse: boolean = false;

    constructor(collection: WordsCollection, reverse: boolean = false) {
        this.collection = collection;
        this.reverse = reverse;

        if (reverse) {
            this.position = collection.getCount() - 1;
        }
    }

    public rewind() {
        this.position = this.reverse ? this.collection.getCount() - 1 : 0;
    }

    public current(): string {
        return this.collection.getItems()[this.position];
    }

    public key(): number {
        return this.position;
    }

    public next(): string {
        const item = this.collection.getItems()[this.position];
        this.position += this.reverse ? -1 : 1;
        return item;
    }

    public valid(): boolean {
        if (this.reverse) {
            return this.position >= 0;
        }

        return this.position < this.collection.getCount();
    }
}

/**
 * Concrete Collections provide one or several methods for retrieving fresh
 * iterator instances, compatible with the collection class.
 */
class WordsCollection implements Aggregator {
    private items: string[] = [];

    public getItems(): string[] {
        return this.items;
    }

    public getCount(): number {
        return this.items.length;
    }

    public addItem(item: string): void {
        this.items.push(item);
    }

    public getIterator(): Iterator<string> {
        return new AlphabeticalOrderIterator(this);
    }

    public getReverseIterator(): Iterator<string> {
        return new AlphabeticalOrderIterator(this, true);
    }
}

/**
 * The client code may or may not know about the Concrete Iterator or Collection
 * classes, depending on the level of indirection you want to keep in your
 * program.
 */
const collection = new WordsCollection();
collection.addItem("First");
collection.addItem("Second");
collection.addItem("Third");

const iterator = collection.getIterator();

console.log("Straight traversal:");
while (iterator.valid()) {
    console.log(iterator.next());
}

console.log("");
console.log("Reverse traversal:");
const reverseIterator = collection.getReverseIterator();
while (reverseIterator.valid()) {
    console.log(reverseIterator.next());
}
```

### Output

```
Straight traversal:
First
Second
Third

Reverse traversal:
Third
Second
First
```

## Also Known As

Cursor

## Real-World Example

Paginated API results where you iterate through pages transparently. The iterator fetches the next page automatically when the current one is exhausted.

```typescript
class PaginatedIterator<T> {
    private page = 0;
    private buffer: T[] = [];
    private done = false;

    constructor(private fetchPage: (page: number) => Promise<T[]>) {}

    async next(): Promise<{ value: T; done: boolean } | { value: undefined; done: true }> {
        if (this.buffer.length === 0 && !this.done) {
            const items = await this.fetchPage(this.page++);
            if (items.length === 0) this.done = true;
            else this.buffer.push(...items);
        }
        if (this.buffer.length === 0) return { value: undefined, done: true };
        return { value: this.buffer.shift()!, done: false };
    }
}

const users = new PaginatedIterator((page) => fetch(`/api/users?page=${page}`).then((r) => r.json()));
```

## When NOT to Use

- When the collection is already an array — just use `for...of`, `.map()`, or `.forEach()`
- In TypeScript/JavaScript, built-in iterators and generators (`function*`) cover most cases
- When the overhead of a custom iterator class outweighs the benefit
- When you need random access, not sequential traversal
