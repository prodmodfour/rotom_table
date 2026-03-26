# Change Reference to Value

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. When a reference object is small, immutable, and infrequently changed, convert it into a value object. Value objects are simpler because they don't require lifecycle management.

## See also

- [[change-value-to-reference]] — the inverse: when independent copies should become a shared reference
