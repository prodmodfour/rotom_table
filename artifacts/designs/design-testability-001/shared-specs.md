# Shared Specifications

## Existing Patterns to Follow

- **`app/utils/captureRate.ts`** — the gold standard for server-side PTU computation. Same file structure: typed input, typed result with breakdown, pure functions, zero side effects.
- **`app/server/api/capture/rate.post.ts`** — thin endpoint that extracts parameters from DB records and calls the pure utility. Same pattern for `calculate-damage.post.ts`.
- **`app/server/services/combatant.service.ts`** — existing damage application logic. The HP marker enhancement extends `calculateDamage()` in this file.
- **`app/composables/useCombat.ts:242-261`** — source for the 18-type effectiveness chart.
- **`app/composables/useCombat.ts:96-125`** — source for the DB → set damage chart.
- **`app/composables/useCombat.ts:11-25`** — source for the stage multiplier table.

---


## PTU Rule Questions

1. **Evasion + Speed Evasion stacking:** PTU says "you may only add ONE of the three evasions to any one accuracy check" (07-combat.md:636). The calculate-damage endpoint reports all three evasions but the test/client must choose which to apply. Should the endpoint accept a `chosenEvasionType` parameter, or always report the best applicable evasion for the move's damage class?

2. **Damage Reduction sources:** The current design accepts an optional `damageReduction` parameter. PTU Damage Reduction comes from abilities, items, and effects. Should the endpoint auto-detect DR from the target's abilities, or accept it as an explicit parameter? Explicit is simpler and avoids parsing ability effects.

3. **Five-Strike / Double-Strike (step 2):** Some moves hit multiple times with modified DB. Should this be handled by the endpoint (accepting a `strikeCount` parameter), or should the client call the endpoint once per strike? One-call-per-strike is simpler and matches PTU's "each hit is a separate damage instance" rule.


## Questions for Senior Reviewer

1. **Shared utility location:** `app/utils/damageCalculation.ts` is importable by both server and client. The existing `captureRate.ts` is in the same location. Is this the right place, or should server-only computation live under `app/server/utils/`?

2. **Type chart duplication:** The 18-type chart will exist in both `damageCalculation.ts` (for server) and `useCombat.ts` (for client). Should the client composable be refactored to import from the shared utility in this phase, or defer to a separate refactoring ticket?

3. **Negative HP (Option A vs B):** For HP marker injuries, Option A (separate `effectiveHp` field) is less disruptive but adds a field to the combatant schema. Option B (allow negative `currentHp`) is cleaner but touches UI code. Which approach aligns better with the app's architecture?

4. **Move execution integration:** Should `move.post.ts` be updated to use `calculateDamage()` internally (making the server authoritative for damage), or keep it as a separate read-only calculation endpoint? The read-only approach is lower risk and achieves the testability goal.

---


## Implementation Notes

### Suggested Implementation Order

1. **`app/utils/damageCalculation.ts`** — pure functions, unit-testable immediately
2. **`app/server/api/encounters/[id]/calculate-damage.post.ts`** — thin endpoint
3. **Unit tests for `damageCalculation.ts`** — verify each formula step against PTU rules
4. **E2E tests using the endpoint** — convert tautological tests to call the server
5. **Evasion functions** — add to `damageCalculation.ts`, extend endpoint response
6. **HP marker detection** — modify `combatant.service.ts`, extend `DamageResult`

### What NOT To Change (Yet)

- `damage.post.ts` — continues accepting pre-computed damage (existing workflow unbroken)
- `move.post.ts` — continues accepting client-sent `targetDamages` (existing workflow unbroken)
- `useMoveCalculation.ts` — client composable unchanged (still drives the UI)
- `useCombat.ts` — client composable unchanged (still has the type chart and stage table)
- Prisma schema — no model changes needed for P0 or P1

The eventual goal is for `move.post.ts` to call `calculateDamage()` internally, making the server authoritative. But that is a separate design — this design focuses on testability.

