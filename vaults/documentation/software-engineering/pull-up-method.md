# Pull Up Method

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When subclasses have methods that perform similar work, standardize them and move the method to the parent class.

Eliminates [[duplicate-code-smell|duplicate code]] across the hierarchy.

## See also

- [[push-down-method]] — the inverse: move a method to subclasses when only some of them use it
