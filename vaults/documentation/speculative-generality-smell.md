# Speculative Generality

A [[dispensable-smells|dispensable]] [[code-smells|smell]]. Unused classes, methods, fields, or parameters created "just in case" for anticipated future needs that never materialized. This over-engineering adds complexity without immediate purpose.

Code should solve today's problem. If a future need arises, it can be added then — designing for hypothetical requirements wastes effort and clutters the codebase.

## See also

- [[lazy-class-smell]] — speculative generality often produces lazy classes that have no real job
