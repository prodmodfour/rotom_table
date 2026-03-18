# Preserve Whole Object

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When you extract multiple values from an object to pass as individual parameters, pass the entire object instead.

Reduces the parameter count and decouples the caller from the object's internal structure — if the object's fields change, only the method body needs updating.

## See also

- [[long-parameter-list-smell]] — this technique reduces long parameter lists
- [[introduce-parameter-object]] — an alternative when the values don't come from a single existing object
