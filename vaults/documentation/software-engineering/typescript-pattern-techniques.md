# TypeScript Pattern Techniques

TypeScript language features that enable [[design-patterns|design pattern]] implementation. These techniques recur across multiple patterns and form the practical bridge between abstract pattern concepts and working TypeScript code.

## Interfaces for contracts

Nearly all patterns define their contracts through TypeScript interfaces. Interfaces specify what methods components must implement without dictating how. This enables [[open-closed-principle|open-closed]] designs where client code depends on abstractions. Used by virtually every pattern for product types, handler contracts, component interfaces, and strategy definitions.

## Abstract classes for partial implementations

Patterns that need shared base behavior use abstract classes with both concrete and abstract methods. Abstract methods force subclasses to provide specific implementations. Concrete methods in the base class provide default behavior or orchestration logic. Used by [[template-method-pattern]], [[chain-of-responsibility-pattern]], [[composite-pattern]], [[state-pattern]], and [[factory-method-pattern]].

## Generics for type safety

TypeScript generics parameterize pattern contracts so implementations can work with any data type. [[iterator-pattern]] uses `Iterator<T>` to parameterize the element type. [[chain-of-responsibility-pattern]] uses `Handler<Request, Result>` for flexible request and result typing.

## Access modifiers for encapsulation

`private` constructors prevent direct instantiation ([[singleton-pattern]]). `protected` members enable subclass access while hiding from outside code ([[template-method-pattern]], [[decorator-pattern]], [[bridge-pattern]]). Static private fields with `#` syntax store class-level state.

## Type guards for runtime checking

TypeScript type predicates (`object is Type`) enable safe runtime type narrowing. [[command-pattern]] uses this for checking whether an object implements the command interface. `instanceof` checks allow [[observer-pattern|observers]] to access concrete subject state safely.

## Composition via constructor injection

Most [[structural-patterns]] and [[behavioral-patterns]] inject dependencies through constructors rather than inheritance, favoring composition. The injected object is typed as an interface, enabling substitution of any concrete implementation.

## See also

- [[design-patterns]] — the patterns these techniques implement
- [[solid-principles]] — the design rules that motivate these implementation choices
