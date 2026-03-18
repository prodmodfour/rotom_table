# Push Down Field

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When a field in the parent class is used by only a few subclasses, move it into those subclasses.

Keeps the parent class focused on what's truly shared.

## See also

- [[pull-up-field]] — the inverse: move a shared field to the parent
- [[refused-bequest-smell]] — unused inherited fields are a form of refused bequest
