# Inappropriate Intimacy

A [[coupler-smells|coupler]] [[code-smells|smell]]. One class uses the internal fields and methods of another class. Classes that access each other's implementation details become tightly coupled — changes to one ripple through the other.

The fix involves moving methods or fields to where they belong, extracting shared behavior into a new class, or replacing direct access with proper interfaces.

## See also

- [[law-of-demeter]] — reaching into another class's internals violates this principle
- [[tell-dont-ask]] — instead of reaching in to read data, tell the object to do the work
