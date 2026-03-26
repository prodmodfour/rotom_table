# Replace Temp with Query

A [[composing-methods-techniques|composing methods]] [[refactoring-techniques|technique]]. Move an expression stored in a local variable into its own method that returns the result. Replace all references to the temp with calls to the new method.

Use when multiple methods need the same calculated value — a query method enables broader reuse than a local temp.
