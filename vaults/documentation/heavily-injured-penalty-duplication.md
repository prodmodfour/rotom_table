# Heavily Injured Penalty Duplication

The same ~30-line heavily injured penalty flow is copy-pasted across 12 encounter route files: `next-turn`, `move`, `damage`, `switch`, `release`, `recall`, `breather`, `use-item`, `sprint`, `mount`, `living-weapon/engage`, and `action`. Each copy handles the identical sequence: check heavily injured threshold → apply penalty → apply faint status → check death → apply Dead status → sync entity to database → set flag.

This is the [[duplicate-code-smell]] at its most severe — a bug fix or rule change to the heavily injured mechanic must be applied in 12 places. The total duplicated code is ~360 lines.

Extracting into a single service function (e.g., `applyHeavilyInjuredPenaltyFlow`) would reduce this to 12 one-line calls. This is also a symptom of [[routes-bypass-service-layer|routes containing business logic]] rather than delegating to services.

## See also

- [[shotgun-surgery-smell]] — changing the heavily injured rules requires editing 12 files
- [[single-responsibility-principle]] — the penalty logic is a domain concern, not an HTTP concern
- [[extract-method]] — the refactoring technique that would fix this
- [[service-delegation-rule]] — the penalty flow belongs in a service, not in routes
- [[next-turn-route-business-logic]] — the worst offender, containing this plus 11 other concerns
- [[heavily-injured-penalty-extraction]] — a potential design to extract a single service function
