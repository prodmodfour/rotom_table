# State Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that lets an object change its behavior when its internal state changes, making it appear as though the object changed its class.

## Problem

Objects that behave differently depending on current state are traditionally implemented with extensive conditional statements. As states and state-dependent behaviors multiply, conditionals scatter across methods and become impossible to maintain.

## Solution

Create a separate class for each possible state, extracting all state-specific behavior into it. The context object holds a reference to a concrete state object and delegates state-dependent operations to it. Transitioning between states means replacing the active state object. State classes can trigger transitions themselves.

## When to use

- An object behaves dramatically differently across multiple states
- Massive conditionals pollute a class, with branches governed by field values
- Significant code duplication exists across similar states and transitions

## Pros and cons

Isolates state-related code into dedicated classes ([[single-responsibility-principle]]). New states can be added without modifying existing ones ([[open-closed-principle]]). Eliminates bulky conditionals. The tradeoff is unnecessary complexity for simple state machines with few states.

## TypeScript implementation

Uses an abstract class for the base state with a `protected` back-reference to the context, set via `setContext()`. The context delegates behavior to the current state object through its public methods. States trigger transitions by calling `context.transitionTo(new ConcreteState())`, creating a new state instance each time. The context's `transitionTo` method updates its state reference and sets the new state's context. See [[typescript-pattern-techniques]].

## See also

- [[strategy-pattern]] — similar structure based on composition, but Strategy keeps implementations independent while State allows states to trigger transitions
- [[bridge-pattern]] — shares a composition-based delegation structure
- [[replace-type-code-with-state-strategy]] — the refactoring technique that introduces this pattern
- [[switch-statements-smell]] — the code smell this pattern eliminates
