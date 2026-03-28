# Pure Service Testability Boundary

Domain logic services that are pure functions — zero database imports, no side effects — enforce a [[single-responsibility-principle]] boundary: pure services handle domain logic only, never persistence.

The purity contract means these services are trivially unit-testable without mocking persistence: weather automation, status automation, grid placement, encounter generation, ball conditions, mounting, and living weapon logic never touch the database.

This is a strong [[single-responsibility-principle]] adherence point — each pure service has exactly one reason to change (its domain rules), not two (domain rules + persistence).

## See also

- [[dependency-inversion-principle]] — pure services depend on data passed in, not on an ORM
- [[refactoring-must-pass-tests]] — purity makes these services the easiest to cover with tests
- [[technical-debt-cause-missing-tests]] — the purity boundary reduces the cost of writing tests
