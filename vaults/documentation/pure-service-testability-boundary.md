# Pure Service Testability Boundary

Ten of 23 services in the [[service-inventory]] are classified as pure functions in [[service-pattern-classification]]: zero database imports, no side effects. This enforces a [[single-responsibility-principle]] boundary — pure services handle domain logic only, never persistence.

The purity contract means these services are trivially unit-testable without mocking Prisma: weather-automation, status-automation, grid-placement, encounter-generation, ball-condition, mounting, living-weapon, living-weapon-abilities, living-weapon-movement, and living-weapon-state never touch the database.

This is one of the strongest [[single-responsibility-principle]] adherence points in the codebase — each pure service has exactly one reason to change (its domain rules), not two (domain rules + persistence).

## See also

- [[dependency-inversion-principle]] — pure services depend on data passed in, not on the Prisma ORM
- [[refactoring-must-pass-tests]] — purity makes these services the easiest to cover with tests
- [[technical-debt-cause-missing-tests]] — the purity boundary reduces the cost of writing tests
- [[routes-bypass-service-layer]] — contrast with routes that skip the service layer entirely
