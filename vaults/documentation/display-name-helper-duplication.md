# Display Name Helper Duplication

The `getDisplayName` helper function — which checks if a combatant is a Pokemon (returning nickname or species name) or a human (returning character name) — is duplicated identically in 5 service files: `out-of-turn.service.ts`, `intercept.service.ts`, `healing-item.service.ts`, `encounter.service.ts`, and `status-automation.service.ts`.

This is a minor but textbook [[duplicate-code-smell]]. A single shared utility function would eliminate the duplication and provide exactly one place to change if the display name logic evolves (e.g., adding trainer class prefix, handling unnamed Pokemon differently).

## See also

- [[extract-method]] — the refactoring technique that applies here
- [[entity-union-unsafe-downcasts]] — the underlying `Pokemon | HumanCharacter` union is what forces the type check in each copy
- [[display-name-utility-extraction]] — the proposed extraction into a shared utility
