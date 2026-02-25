# Command

Command turns a request into a stand-alone object for deferred execution, queuing, or undo. [Learn more](https://refactoring.guru/design-patterns/command)

**Category:** Behavioral

## TypeScript Example

```typescript
/**
 * The Command interface declares a method for executing a command.
 */
interface Command {
    execute(): void;
}

/**
 * Some commands can implement simple operations on their own.
 */
class SimpleCommand implements Command {
    private payload: string;

    constructor(payload: string) {
        this.payload = payload;
    }

    public execute(): void {
        console.log(`SimpleCommand: See, I can do simple things like printing (${this.payload})`);
    }
}

/**
 * However, some commands can delegate more complex operations to other objects,
 * called "receivers."
 */
class ComplexCommand implements Command {
    private receiver: Receiver;

    /**
     * Context data, required for launching the receiver's methods.
     */
    private a: string;

    private b: string;

    /**
     * Complex commands can accept one or several receiver objects along with
     * any context data via the constructor.
     */
    constructor(receiver: Receiver, a: string, b: string) {
        this.receiver = receiver;
        this.a = a;
        this.b = b;
    }

    /**
     * Commands can delegate to any methods of a receiver.
     */
    public execute(): void {
        console.log("ComplexCommand: Complex stuff should be done by a receiver object.");
        this.receiver.doSomething(this.a);
        this.receiver.doSomethingElse(this.b);
    }
}

/**
 * The Receiver classes contain some important business logic. They know how to
 * perform all kinds of operations, associated with carrying out a request. In
 * fact, any class may serve as a Receiver.
 */
class Receiver {
    public doSomething(a: string): void {
        console.log(`Receiver: Working on (${a}.)`);
    }

    public doSomethingElse(b: string): void {
        console.log(`Receiver: Also working on (${b}.)`);
    }
}

/**
 * The Invoker is associated with one or several commands. It sends a request to
 * the command.
 */
class Invoker {
    private onStart: Command;

    private onFinish: Command;

    /**
     * Initialize commands.
     */
    public setOnStart(command: Command): void {
        this.onStart = command;
    }

    public setOnFinish(command: Command): void {
        this.onFinish = command;
    }

    /**
     * The Invoker does not depend on concrete command or receiver classes. The
     * Invoker passes a request to a receiver indirectly, by executing a
     * command.
     */
    public doSomethingImportant(): void {
        console.log("Invoker: Does anybody want something done before I begin?");
        if (this.isCommand(this.onStart)) {
            this.onStart.execute();
        }

        console.log("Invoker: ...doing something really important...");

        console.log("Invoker: Does anybody want something done after I finish?");
        if (this.isCommand(this.onFinish)) {
            this.onFinish.execute();
        }
    }

    private isCommand(object): object is Command {
        return object.execute !== undefined;
    }
}

/**
 * The client code can parameterize an invoker with any commands.
 */
const invoker = new Invoker();
invoker.setOnStart(new SimpleCommand("Say Hi!"));
const receiver = new Receiver();
invoker.setOnFinish(new ComplexCommand(receiver, "Send email", "Save report"));

invoker.doSomethingImportant();
```

### Output

```
Invoker: Does anybody want something done before I begin?
SimpleCommand: See, I can do simple things like printing (Say Hi!)
Invoker: ...doing something really important...
Invoker: Does anybody want something done after I finish?
ComplexCommand: Complex stuff should be done by a receiver object.
Receiver: Working on (Send email.)
Receiver: Also working on (Save report.)
```

## Also Known As

Action, Transaction

## Real-World Example

An undo/redo system in a text editor or drawing app. Each action is encapsulated as a command object that can be executed and reversed.

```typescript
interface Command {
    execute(): void;
    undo(): void;
}

class AddTextCommand implements Command {
    constructor(
        private editor: TextEditor,
        private text: string,
    ) {}
    execute() {
        this.editor.insert(this.text);
    }
    undo() {
        this.editor.deleteChars(this.text.length);
    }
}

class TextEditor {
    private content = "";
    insert(text: string) {
        this.content += text;
    }
    deleteChars(count: number) {
        this.content = this.content.slice(0, -count);
    }
    getContent() {
        return this.content;
    }
}

class CommandHistory {
    private history: Command[] = [];

    execute(command: Command) {
        command.execute();
        this.history.push(command);
    }

    undo() {
        const command = this.history.pop();
        command?.undo();
    }
}

const editor = new TextEditor();
const history = new CommandHistory();
history.execute(new AddTextCommand(editor, "Hello "));
history.execute(new AddTextCommand(editor, "World"));
console.log(editor.getContent()); // "Hello World"
history.undo();
console.log(editor.getContent()); // "Hello "
```

## When NOT to Use

- When operations are simple and don't need undo, queuing, or logging
- When it adds a class for every action in the system — can lead to class explosion
- When a simple callback or function reference achieves the same goal
