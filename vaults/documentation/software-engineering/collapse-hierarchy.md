# Collapse Hierarchy

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When a subclass is practically the same as its parent — adding no meaningful fields, methods, or behavioral variation — merge them into one class.

## See also

- [[lazy-class-smell]] — a subclass that adds nothing is a lazy class
- [[replace-subclass-with-fields]] — a related technique when the only difference is constant-returning methods
