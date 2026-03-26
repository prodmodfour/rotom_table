# Introduce Parameter Object

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When a repeating group of parameters appears across multiple methods, bundle them into a single object.

The parameter object reduces clutter, gives the group a name, and often attracts behavior that was previously scattered across callers.

## See also

- [[long-parameter-list-smell]] — the primary smell this technique addresses
- [[data-clumps-smell]] — repeated parameter groups are data clumps
- [[preserve-whole-object]] — an alternative when the values already come from a single object
