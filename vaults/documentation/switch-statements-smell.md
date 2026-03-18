# Switch Statements

An [[object-orientation-abuser-smells|object-orientation abuser]] [[code-smells|smell]]. Complex `switch` operators or long sequences of `if` statements that branch on object type or state to determine behavior.

This pattern typically indicates that polymorphism should be used instead — let each type define its own behavior rather than centralizing type-based logic in a single branching structure.

## See also

- [[replace-conditional-with-polymorphism]] — the primary technique for eliminating switch statements
- [[replace-type-code-with-subclasses]] — replaces a type code that drives the switch with a class hierarchy
- [[state-pattern]] — eliminates state-dependent conditionals by delegating to state objects
- [[strategy-pattern]] — eliminates algorithm-selection conditionals by delegating to strategy objects
- [[open-closed-principle]] — switch statements violate OCP because adding a new type requires modifying the existing switch
- [[trigger-validation-switch-chains]] — switch/if chains in services and composables
