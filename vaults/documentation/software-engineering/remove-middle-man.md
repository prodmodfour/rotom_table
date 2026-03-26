# Remove Middle Man

A [[moving-features-techniques|moving features]] [[refactoring-techniques|technique]]. When a class has too many methods that simply delegate to another object, delete the delegating methods and let clients call the target directly.

## See also

- [[middle-man-smell]] — the primary smell this technique addresses
- [[hide-delegate]] — the inverse: add delegation to hide an internal object
