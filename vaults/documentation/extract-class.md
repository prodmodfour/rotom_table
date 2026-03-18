# Extract Class

A [[moving-features-techniques|moving features]] [[refactoring-techniques|technique]]. When one class does the work of two, create a new class and move the relevant fields and methods into it.

## See also

- [[large-class-smell]] — the primary smell this technique addresses
- [[single-responsibility-principle]] — Extract Class restores SRP to a class handling too many concerns
- [[inline-class]] — the inverse: merge a class that does too little
- [[combatant-service-decomposition]] — splitting a 792-line service into 5 focused services
- [[turn-advancement-service-extraction]] — extracting 846 lines of business logic from a route into a service
