# Decompose Conditional

A [[simplifying-conditionals-techniques|simplifying conditionals]] [[refactoring-techniques|technique]]. When a complex conditional (`if-then-else` or `switch`) is hard to read, extract the condition, the then-branch, and the else-branch into separate methods with descriptive names.

The method names explain the *why* of each branch, making the conditional's structure immediately clear.

## See also

- [[extract-method]] — the underlying mechanic used to perform the decomposition
