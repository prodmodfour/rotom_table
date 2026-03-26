# Remove Parameter

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When a parameter isn't used in the body of a method, remove it from the method signature.

Every parameter is a piece of information the caller must supply. Unused parameters confuse callers and add unnecessary coupling.

## See also

- [[dead-code-smell]] — an unused parameter is a form of dead code
