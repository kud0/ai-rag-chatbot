# TypeScript Basics: Essential Guide for Modern Development

## Introduction to TypeScript

TypeScript is a strongly typed superset of JavaScript that adds static type checking and modern features to JavaScript. Developed by Microsoft, it compiles to plain JavaScript and runs anywhere JavaScript runs. TypeScript helps catch errors early, improves code quality, and enhances developer productivity through better IDE support and refactoring capabilities.

## Why TypeScript?

### Benefits

1. **Type Safety**: Catch errors at compile time instead of runtime
2. **Better IDE Support**: Autocomplete, refactoring, and inline documentation
3. **Code Maintainability**: Self-documenting code through types
4. **Refactoring Confidence**: Safe refactoring with type checking
5. **Modern Features**: Latest ECMAScript features with backward compatibility

## Basic Types

### Primitive Types

```typescript
// String
let name: string = "John Doe"

// Number
let age: number = 30
let price: number = 19.99

// Boolean
let isActive: boolean = true

// Null and Undefined
let value: null = null
let notDefined: undefined = undefined

// Symbol
let sym: symbol = Symbol("key")

// BigInt
let big: bigint = 100n
```

### Arrays

```typescript
// Array of numbers
let numbers: number[] = [1, 2, 3, 4, 5]
let moreNumbers: Array<number> = [6, 7, 8]

// Array of strings
let names: string[] = ["Alice", "Bob", "Charlie"]

// Mixed array (use union types)
let mixed: (number | string)[] = [1, "two", 3, "four"]
```

### Tuples

Tuples are arrays with fixed length and types:

```typescript
// Tuple
let person: [string, number] = ["John", 30]

// Optional tuple elements
let optional: [string, number?] = ["Alice"]

// Rest elements
let rest: [number, ...string[]] = [1, "a", "b", "c"]

// Named tuples (TypeScript 4.0+)
let namedTuple: [name: string, age: number] = ["Bob", 25]
```

### Objects

```typescript
// Object type
let user: {
  name: string
  age: number
  email?: string // Optional property
} = {
  name: "John",
  age: 30
}

// Index signatures
let dictionary: {
  [key: string]: number
} = {
  apples: 5,
  oranges: 10
}
```

## Interfaces

Interfaces define the structure of objects:

```typescript
interface User {
  id: number
  name: string
  email: string
  age?: number // Optional
  readonly createdAt: Date // Read-only
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  createdAt: new Date()
}

// user.createdAt = new Date() // Error: Cannot assign to read-only property
```

### Extending Interfaces

```typescript
interface Person {
  name: string
  age: number
}

interface Employee extends Person {
  employeeId: number
  department: string
}

const employee: Employee = {
  name: "Bob",
  age: 30,
  employeeId: 12345,
  department: "Engineering"
}
```

### Interface Methods

```typescript
interface Calculator {
  add(a: number, b: number): number
  subtract(a: number, b: number): number
}

const calc: Calculator = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
}
```

## Type Aliases

Type aliases create custom types:

```typescript
// Basic type alias
type ID = string | number

// Object type alias
type Point = {
  x: number
  y: number
}

// Function type alias
type MathOperation = (a: number, b: number) => number

const add: MathOperation = (a, b) => a + b

// Union type
type Status = "pending" | "approved" | "rejected"

let orderStatus: Status = "pending"
```

## Union and Intersection Types

### Union Types

```typescript
// Union type (OR)
type StringOrNumber = string | number

function format(value: StringOrNumber): string {
  if (typeof value === "string") {
    return value.toUpperCase()
  }
  return value.toFixed(2)
}

// Discriminated unions
type Success = { status: "success"; data: string }
type Error = { status: "error"; error: string }
type Result = Success | Error

function handleResult(result: Result) {
  if (result.status === "success") {
    console.log(result.data)
  } else {
    console.error(result.error)
  }
}
```

### Intersection Types

```typescript
// Intersection type (AND)
type Named = { name: string }
type Aged = { age: number }
type Person = Named & Aged

const person: Person = {
  name: "John",
  age: 30
}
```

## Functions

### Function Types

```typescript
// Function with typed parameters and return type
function add(a: number, b: number): number {
  return a + b
}

// Arrow function
const multiply = (a: number, b: number): number => a * b

// Optional parameters
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`
}

// Default parameters
function createUser(name: string, role: string = "user"): User {
  return { name, role }
}

// Rest parameters
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0)
}
```

### Function Overloads

```typescript
function format(value: string): string
function format(value: number): string
function format(value: boolean): string
function format(value: string | number | boolean): string {
  return String(value)
}
```

## Generics

Generics allow you to write reusable, type-safe code:

```typescript
// Generic function
function identity<T>(value: T): T {
  return value
}

const num = identity<number>(42)
const str = identity<string>("hello")

// Generic interface
interface Box<T> {
  value: T
}

const numberBox: Box<number> = { value: 42 }
const stringBox: Box<string> = { value: "hello" }

// Generic constraints
interface HasLength {
  length: number
}

function logLength<T extends HasLength>(value: T): void {
  console.log(value.length)
}

logLength("hello") // OK
logLength([1, 2, 3]) // OK
// logLength(42) // Error: number doesn't have length property

// Multiple type parameters
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second]
}

const p = pair<string, number>("age", 30)
```

## Classes

```typescript
class Animal {
  // Properties
  private name: string
  protected age: number
  public species: string

  // Constructor
  constructor(name: string, age: number, species: string) {
    this.name = name
    this.age = age
    this.species = species
  }

  // Methods
  public describe(): string {
    return `${this.name} is a ${this.age}-year-old ${this.species}`
  }

  // Getter
  get animalName(): string {
    return this.name
  }

  // Setter
  set animalName(value: string) {
    this.name = value
  }
}

// Inheritance
class Dog extends Animal {
  constructor(name: string, age: number) {
    super(name, age, "dog")
  }

  public bark(): void {
    console.log("Woof!")
  }
}

// Abstract classes
abstract class Shape {
  abstract area(): number
  abstract perimeter(): number

  describe(): string {
    return `Area: ${this.area()}, Perimeter: ${this.perimeter()}`
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super()
  }

  area(): number {
    return Math.PI * this.radius ** 2
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius
  }
}
```

## Utility Types

TypeScript provides built-in utility types:

```typescript
interface User {
  id: number
  name: string
  email: string
  age: number
}

// Partial - makes all properties optional
type PartialUser = Partial<User>

// Required - makes all properties required
type RequiredUser = Required<User>

// Readonly - makes all properties read-only
type ReadonlyUser = Readonly<User>

// Pick - select specific properties
type UserPreview = Pick<User, "id" | "name">

// Omit - exclude specific properties
type UserWithoutId = Omit<User, "id">

// Record - create object type with specific keys and value types
type Roles = Record<string, string[]>

// ReturnType - extract return type of function
function getUser() {
  return { id: 1, name: "John" }
}
type UserReturnType = ReturnType<typeof getUser>

// Parameters - extract parameter types
function createUser(name: string, age: number) {}
type CreateUserParams = Parameters<typeof createUser>
```

## Type Guards

```typescript
// typeof type guard
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase()
  }
  return value.toFixed(2)
}

// instanceof type guard
class Dog {
  bark() {}
}
class Cat {
  meow() {}
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark()
  } else {
    animal.meow()
  }
}

// Custom type guard
interface Fish {
  swim: () => void
}
interface Bird {
  fly: () => void
}

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined
}

function move(pet: Fish | Bird) {
  if (isFish(pet)) {
    pet.swim()
  } else {
    pet.fly()
  }
}
```

## Enums

```typescript
// Numeric enum
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

// String enum
enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Pending = "PENDING"
}

// Const enum (more performant)
const enum Colors {
  Red = "#FF0000",
  Green = "#00FF00",
  Blue = "#0000FF"
}
```

## Best Practices

1. **Enable Strict Mode**: Use `"strict": true` in tsconfig.json
2. **Avoid `any`**: Use `unknown` or proper types instead
3. **Use Interfaces for Objects**: Interfaces over type aliases for object shapes
4. **Leverage Type Inference**: Let TypeScript infer types when obvious
5. **Use Const Assertions**: `as const` for literal types
6. **Prefer Union Types**: Over enums when possible
7. **Use Utility Types**: Leverage built-in utility types
8. **Type Your Functions**: Always type parameters and return values

## Conclusion

TypeScript significantly improves JavaScript development by adding static typing, better tooling, and modern language features. Understanding these basics provides a solid foundation for building type-safe, maintainable applications.
