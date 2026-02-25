# Flyweight

Flyweight shares common state between many objects to reduce memory consumption. [Learn more](https://refactoring.guru/design-patterns/flyweight)

**Category:** Structural

## TypeScript Example

```typescript
/**
 * The Flyweight stores a common portion of the state (also called intrinsic
 * state) that belongs to multiple real business entities. The Flyweight accepts
 * the rest of the state (extrinsic state, unique for each entity) via its
 * method parameters.
 */
class Flyweight {
    private sharedState: any;

    constructor(sharedState: any) {
        this.sharedState = sharedState;
    }

    public operation(uniqueState): void {
        const s = JSON.stringify(this.sharedState);
        const u = JSON.stringify(uniqueState);
        console.log(`Flyweight: Displaying shared (${s}) and unique (${u}) state.`);
    }
}

/**
 * The Flyweight Factory creates and manages the Flyweight objects. It ensures
 * that flyweights are shared correctly. When the client requests a flyweight,
 * the factory either returns an existing instance or creates a new one, if it
 * doesn't exist yet.
 */
class FlyweightFactory {
    private flyweights: { [key: string]: Flyweight } = <any>{};

    constructor(initialFlyweights: string[][]) {
        for (const state of initialFlyweights) {
            this.flyweights[this.getKey(state)] = new Flyweight(state);
        }
    }

    /**
     * Returns a Flyweight's string hash for a given state.
     */
    private getKey(state: string[]): string {
        return state.join("_");
    }

    /**
     * Returns an existing Flyweight with a given state or creates a new one.
     */
    public getFlyweight(sharedState: string[]): Flyweight {
        const key = this.getKey(sharedState);

        if (!(key in this.flyweights)) {
            console.log("FlyweightFactory: Can't find a flyweight, creating new one.");
            this.flyweights[key] = new Flyweight(sharedState);
        } else {
            console.log("FlyweightFactory: Reusing existing flyweight.");
        }

        return this.flyweights[key];
    }

    public listFlyweights(): void {
        const count = Object.keys(this.flyweights).length;
        console.log(`\nFlyweightFactory: I have ${count} flyweights:`);
        for (const key in this.flyweights) {
            console.log(key);
        }
    }
}

/**
 * The client code usually creates a bunch of pre-populated flyweights in the
 * initialization stage of the application.
 */
const factory = new FlyweightFactory([
    ["Chevrolet", "Camaro2018", "pink"],
    ["Mercedes Benz", "C300", "black"],
    ["Mercedes Benz", "C500", "red"],
    ["BMW", "M5", "red"],
    ["BMW", "X6", "white"],
    // ...
]);
factory.listFlyweights();

// ...

function addCarToPoliceDatabase(
    ff: FlyweightFactory,
    plates: string,
    owner: string,
    brand: string,
    model: string,
    color: string,
) {
    console.log("\nClient: Adding a car to database.");
    const flyweight = ff.getFlyweight([brand, model, color]);

    // The client code either stores or calculates extrinsic state and passes it
    // to the flyweight's methods.
    flyweight.operation([plates, owner]);
}

addCarToPoliceDatabase(factory, "CL234IR", "James Doe", "BMW", "M5", "red");

addCarToPoliceDatabase(factory, "CL234IR", "James Doe", "BMW", "X1", "red");

factory.listFlyweights();
```

### Output

```
FlyweightFactory: I have 5 flyweights:
Chevrolet_Camaro2018_pink
Mercedes Benz_C300_black
Mercedes Benz_C500_red
BMW_M5_red
BMW_X6_white

Client: Adding a car to database.
FlyweightFactory: Reusing existing flyweight.
Flyweight: Displaying shared (["BMW","M5","red"]) and unique (["CL234IR","James Doe"]) state.

Client: Adding a car to database.
FlyweightFactory: Can't find a flyweight, creating new one.
Flyweight: Displaying shared (["BMW","X1","red"]) and unique (["CL234IR","James Doe"]) state.

FlyweightFactory: I have 6 flyweights:
Chevrolet_Camaro2018_pink
Mercedes Benz_C300_black
Mercedes Benz_C500_red
BMW_M5_red
BMW_X6_white
BMW_X1_red
```

## Also Known As

Cache

## Real-World Example

A map application rendering thousands of markers. Instead of creating a unique icon object for each marker, share icon objects by type (restaurant, hotel, gas station) and only store unique data (coordinates) per marker.

```typescript
class MarkerIcon {
    constructor(
        public type: string,
        public color: string,
        public svgPath: string,
    ) {}
}

class MarkerIconFactory {
    private icons = new Map<string, MarkerIcon>();

    getIcon(type: string, color: string, svgPath: string): MarkerIcon {
        const key = `${type}-${color}`;
        if (!this.icons.has(key)) {
            this.icons.set(key, new MarkerIcon(type, color, svgPath));
        }
        return this.icons.get(key)!;
    }
}

class MapMarker {
    constructor(
        public lat: number,
        public lng: number,
        public icon: MarkerIcon,
    ) {}
}

const factory = new MarkerIconFactory();
const markers = coordinates.map(
    ({ lat, lng, type }) => new MapMarker(lat, lng, factory.getIcon(type, "red", "/icons/pin.svg")),
);
```

## When NOT to Use

- When RAM isn't a concern and there aren't many duplicate objects
- When objects don't have significant shared state to extract
- When the complexity of managing shared vs unique state outweighs the memory savings
