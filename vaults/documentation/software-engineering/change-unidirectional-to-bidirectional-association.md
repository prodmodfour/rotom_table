# Change Unidirectional to Bidirectional Association

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. When two classes need each other's features but the link only goes one way, add the reverse association.

Use sparingly — bidirectional associations add complexity. Only add the reverse link when the dependency is genuinely mutual.

## See also

- [[change-bidirectional-to-unidirectional-association]] — the inverse: remove an unnecessary reverse link
