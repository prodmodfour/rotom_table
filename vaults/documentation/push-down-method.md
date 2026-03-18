# Push Down Method

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When a method in the parent class is used by only one or a few subclasses, move it into those subclasses.

Keeps the parent class focused on universally shared behavior.

## See also

- [[pull-up-method]] — the inverse: move a shared method to the parent
- [[refused-bequest-smell]] — unused inherited methods are a form of refused bequest
