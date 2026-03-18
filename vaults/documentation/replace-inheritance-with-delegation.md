# Replace Inheritance with Delegation

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When a subclass uses only a portion of the parent's methods or when inheriting the parent's data isn't appropriate, store an instance of the parent as a field and delegate calls to it instead.

Composition is more flexible than inheritance — it doesn't force the child to carry the full weight of the parent's interface.

## See also

- [[refused-bequest-smell]] — the primary smell this technique addresses
- [[replace-delegation-with-inheritance]] — the inverse: use inheritance when delegation becomes excessive
