# Extract Variable

A [[composing-methods-techniques|composing methods]] [[refactoring-techniques|technique]]. Place the result of a complex expression (or its parts) into separate variables with self-explanatory names.

Use when a mathematical or logical expression is hard to follow at a glance. The named variable serves as inline documentation.

## See also

- [[extract-method]] — when the expression deserves reuse beyond a single scope, extract a method instead
- [[inline-temp]] — the inverse: remove a variable when it adds no clarity
