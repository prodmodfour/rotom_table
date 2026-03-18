# Change Bidirectional to Unidirectional Association

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. When a bidirectional association exists but one class no longer uses the other's features, remove the unused direction.

Simplifies the relationship and reduces coupling.

## See also

- [[change-unidirectional-to-bidirectional-association]] — the inverse: add a reverse link when both sides need each other
