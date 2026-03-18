# Message Chains

A [[coupler-smells|coupler]] [[code-smells|smell]]. Long sequences of method calls chained through intermediary objects, like `a.b().c().d()`. Each link in the chain creates a dependency on the intermediate object's structure.

If any intermediate class changes its interface, every chain that passes through it breaks. The fix is to [[hide-delegate]], pushing the needed behavior closer to where the data lives and reducing the caller's knowledge of the chain.

## See also

- [[law-of-demeter]] — the principle that message chains violate; "only talk to your immediate friends"
- [[facade-pattern]] — hides chain internals behind a simplified boundary
