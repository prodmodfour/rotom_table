# Display Name Utility Extraction

A straightforward [[extract-method]] to address the [[display-name-helper-duplication|getDisplayName helper duplicated in 5 services]].

## The idea

Move `getDisplayName(combatant)` into a shared utility file (e.g., `utils/combatantDisplay.ts`) and replace the 5 copies with imports. The function checks if the combatant is a Pokemon (returning nickname or species) or human (returning name).

## Principles improved

- Eliminates the [[duplicate-code-smell]]
- Provides a single point of change if display name logic evolves

## Trade-offs

- Minimal — this is one of the lowest-risk changes available
- The function currently uses `as Pokemon` / `as HumanCharacter` casts, which is an [[entity-union-unsafe-downcasts|existing LSP concern]] that the extraction would inherit but not worsen
- If [[combat-entity-base-interface]] is implemented, this function could be simplified to work on the base type (if `name`/`nickname`/`species` are included)

## Open questions

- Should it live in `utils/` (server-shareable) or `server/utils/` (server-only)? Currently all 5 consumers are services, but components may also need display names.
- Is this worth doing as an isolated change, or better done as part of a broader [[combat-entity-base-interface]] migration?

## See also

- [[extract-method]] — the refactoring technique
- [[entity-union-unsafe-downcasts]] — the underlying type issue the function works around
