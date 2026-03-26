# Move Method

A [[moving-features-techniques|moving features]] [[refactoring-techniques|technique]]. When a method uses more data from another class than from its own, create a new method in the target class, move the logic there, and redirect or remove the original.

## See also

- [[feature-envy-smell]] — the primary smell this technique addresses
- [[move-field]] — often applied together with Move Method
