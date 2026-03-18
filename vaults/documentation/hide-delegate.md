# Hide Delegate

A [[moving-features-techniques|moving features]] [[refactoring-techniques|technique]]. When a client gets object B from object A and then calls a method on B, create a delegating method on A so the client doesn't need to know about B.

This reduces coupling by shielding clients from the internal structure of the objects they use.

## See also

- [[message-chains-smell]] — the primary smell this technique addresses
- [[remove-middle-man]] — the inverse: when too many delegating methods accumulate
