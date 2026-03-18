# Inline Temp

A [[composing-methods-techniques|composing methods]] [[refactoring-techniques|technique]]. Replace references to a temporary variable with the expression itself, then remove the variable.

Use when a temp holds the result of a straightforward expression and the variable name adds no meaningful clarity.

## See also

- [[extract-variable]] — the inverse: introduce a variable when an expression is hard to read
