# Extract Superclass

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When two or more classes share common fields and methods, create a parent class and move the shared members into it.

Eliminates [[duplicate-code-smell|duplication]] and establishes a common type.

## See also

- [[extract-subclass]] — the inverse direction: create a child for specialized behavior
- [[extract-interface]] — when only the method signatures overlap, not the implementations
