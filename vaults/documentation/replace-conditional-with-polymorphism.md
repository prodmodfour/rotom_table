# Replace Conditional with Polymorphism

A [[simplifying-conditionals-techniques|simplifying conditionals]] [[refactoring-techniques|technique]]. When a conditional performs different actions depending on object type or properties, create subclasses for each branch and implement a shared method that each subclass overrides.

The conditional disappears — the runtime dispatches to the correct subclass automatically.

## See also

- [[switch-statements-smell]] — the primary smell this technique addresses
- [[open-closed-principle]] — polymorphism makes the code open for extension without modifying the conditional
- [[strategy-pattern]] — the design pattern that formalizes runtime algorithm selection via polymorphism
- [[replace-type-code-with-subclasses]] — a data-focused view of the same transformation
- [[trigger-validation-strategy-registry]] — a potential application of this technique to validation switch chains
