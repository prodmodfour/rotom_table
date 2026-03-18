# Cause: Tight Coupling of Components

When a project resembles a monolith rather than the product of individual modules, any change to one part affects others. Team development is made more difficult because it's hard to isolate the work of individual members.

This is a form of [[technical-debt]] that grows as components become more entangled.

## See also

- [[cross-store-coordination-rule]] — prevents tight coupling between stores
- [[single-responsibility-principle]] — keeping responsibilities isolated reduces coupling
- [[composable-dependency-chains]] — explicit dependency chains are the alternative to entanglement
- [[composable-store-direct-coupling]] — composables tightly coupled to store singletons
