# Extract Subclass

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When a class has features that are used only in certain cases, create a subclass to hold those features.

Keeps the parent class simple by moving conditional behavior into a specialized subclass.

## See also

- [[extract-superclass]] — the inverse direction: create a parent from shared features
- [[replace-type-code-with-subclasses]] — a related technique when a type code drives the conditional behavior
