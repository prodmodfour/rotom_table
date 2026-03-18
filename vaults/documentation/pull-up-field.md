# Pull Up Field

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When two or more subclasses declare the same field, move it to the parent class.

Eliminates duplication and makes the shared state part of the common interface.

## See also

- [[push-down-field]] — the inverse: move a field to subclasses when only some of them use it
