# Replace Delegation with Inheritance

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When a class contains many simple methods that all delegate to another class, convert the delegating class into a subclass of the target.

Use only when the delegating class truly *is* a specialization of the target — not just when it *uses* the target.

## See also

- [[middle-man-smell]] — excessive delegation is the smell this technique addresses
- [[replace-inheritance-with-delegation]] — the inverse: use composition when inheritance is too broad
