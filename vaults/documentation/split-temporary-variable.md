# Split Temporary Variable

A [[composing-methods-techniques|composing methods]] [[refactoring-techniques|technique]]. When a single variable is assigned multiple times for different purposes, give each purpose its own variable.

Each variable should be responsible for only one thing. Reusing a variable for unrelated values confuses readers about what the variable represents at any given point.
