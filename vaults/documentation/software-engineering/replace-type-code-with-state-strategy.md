# Replace Type Code with State/Strategy

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. When a type code affects behavior but subclassing the original class isn't feasible, extract the type-dependent behavior into a state or strategy object that can be swapped at runtime.

## See also

- [[state-pattern]] — the design pattern introduced when behavior depends on mutable state
- [[strategy-pattern]] — the design pattern introduced when swapping algorithms at runtime
- [[replace-type-code-with-subclasses]] — simpler alternative when direct subclassing is possible
- [[switch-statements-smell]] — both techniques eliminate type-based conditional logic
