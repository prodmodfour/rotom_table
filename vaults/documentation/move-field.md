# Move Field

A [[moving-features-techniques|moving features]] [[refactoring-techniques|technique]]. When a field is used more by another class than by the class that owns it, create the field in the target class and update all references.

## See also

- [[feature-envy-smell]] — the primary smell this technique addresses
- [[move-method]] — often applied together with Move Field
