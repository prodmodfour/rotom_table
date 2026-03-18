# Lazy Class

A [[dispensable-smells|dispensable]] [[code-smells|smell]]. A class that doesn't do enough to justify its existence. Understanding and maintaining classes always costs time — if a class doesn't earn its keep, it should be deleted or merged into another class.

Lazy classes often result from [[refactoring]] that moved behavior elsewhere, leaving a shell behind, or from [[speculative-generality-smell|speculative generality]] that anticipated needs that never materialized.

## See also

- [[inline-class]] — the primary technique for removing a lazy class
- [[collapse-hierarchy]] — when the lazy class is a subclass, merge it into its parent
