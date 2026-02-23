---
review_id: code-review-141
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-060
domain: scenes, encounter-tables
commits_reviewed:
  - 0092fcf
  - 88531ac
  - 6130c04
  - 15af1ab
  - 74aa1b6
  - 25f9261
  - 1d30e22
  - b2966fc
  - 53816d6
files_reviewed:
  - app/pages/gm/scenes/[id].vue
  - app/prisma/schema.prisma
  - app/types/encounter.ts
  - app/server/services/encounter.service.ts
  - app/components/scene/StartEncounterModal.vue
  - app/components/habitat/GenerateEncounterModal.vue
  - app/server/api/encounters/index.post.ts
  - app/server/api/encounters/from-scene.post.ts
  - app/server/api/encounters/[id].put.ts
  - app/server/api/encounters/[id]/significance.put.ts
  - app/stores/encounter.ts
  - app/composables/useEncounterCreation.ts
  - app/pages/gm/encounter-tables.vue
  - app/pages/gm/habitats/[id].vue
  - app/pages/gm/habitats/index.vue
  - .claude/skills/references/app-surface.md
  - app/tests/e2e/artifacts/designs/design-level-budget-001.md
  - app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-060.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-23T09:15:00Z
follows_up: code-review-134
---

## Review Scope

Re-review of 9 commits addressing:
1. **C1 fix** (from code-review-134 / rules-review-124): `characterType === 'pc'` changed to `'player'` in scene budget computed.
2. **P1 significance multiplier**: Full feature implementation -- Prisma schema, types, service, 4 API endpoints, store, composable, 2 modal selectors, 3 parent page handlers, app-surface update.

Verified by reading every changed file in full. Cross-referenced the design spec (design-level-budget-001.md) Section C against the implementation.

## Issues

### MEDIUM

#### M1: `setSignificance` uses `as any` cast instead of proper typing

**File:** `app/stores/encounter.ts` (line 656)

The `setSignificance` action accepts `significanceTier?: string` and then casts it with `significanceTier as any` when spreading into the encounter object. The `Encounter` interface declares `significanceTier: SignificanceTier` (a union type from `encounterBudget.ts`). The `as any` cast bypasses type safety.

```typescript
// Line 656 -- current
...(significanceTier && { significanceTier: significanceTier as any })

// Better: accept SignificanceTier directly
async setSignificance(encounterId: string, significanceMultiplier: number, significanceTier?: SignificanceTier) {
```

This is a type papercut, not a runtime bug, since the only callers pass values from `SIGNIFICANCE_PRESETS` which are valid `SignificanceTier` values. But the `as any` sets a bad precedent and defeats TypeScript's purpose. The fix is to change the parameter type from `string` to `SignificanceTier` (imported from `~/utils/encounterBudget`).

The same loose typing propagates to `createEncounter` and `createFromScene` store actions (both accept `significance?: { multiplier: number; tier: string }` instead of `tier: SignificanceTier`). These should also use the union type. This is a systemic pattern across the 3 store actions and the `useEncounterCreation` composable.

**Required fix:** Change `tier: string` to `tier: SignificanceTier` in the 4 function signatures (`createEncounter`, `createFromScene`, `setSignificance`, `createWildEncounter`). Import `SignificanceTier` where needed.

---

#### M2: No server-side validation of `significanceTier` string value

**Files:** `app/server/api/encounters/[id]/significance.put.ts`, `app/server/api/encounters/index.post.ts`, `app/server/api/encounters/from-scene.post.ts`, `app/server/api/encounters/[id].put.ts`

The `significance.put.ts` endpoint validates `significanceMultiplier` (must be number between 0.5 and 10) but does not validate `significanceTier`. Any arbitrary string can be written to the DB column. The POST and PUT encounter endpoints also accept `significanceTier` without validation.

The valid values are: `'insignificant' | 'everyday' | 'significant' | 'climactic' | 'legendary'`. A malformed value would not crash anything (it would just be stored and displayed as-is), but it violates the principle of validating all user input.

**Required fix:** Add a server-side whitelist check in `significance.put.ts`:

```typescript
const VALID_TIERS = ['insignificant', 'everyday', 'significant', 'climactic', 'legendary']
if (body.significanceTier && !VALID_TIERS.includes(body.significanceTier)) {
  throw createError({
    statusCode: 400,
    message: `significanceTier must be one of: ${VALID_TIERS.join(', ')}`
  })
}
```

The same validation should be applied (or extracted to a shared utility) for the other 3 endpoints that accept `significanceTier`.

---

## What Looks Good

1. **C1 fix is correct and minimal.** Commit `0092fcf` changes exactly one line: `'pc'` to `'player'` on line 223 of `[id].vue`. The `CharacterType` union type (`'player' | 'npc' | 'trainer'`) is now matched correctly. The `budgetInfo` computed property will properly filter to player characters, count them, gather their Pokemon levels, and compute the budget analysis. The previous review's CRITICAL issue is fully resolved.

2. **Prisma schema change is properly scoped.** The `significanceTier` column (commit `88531ac`) has `@default("insignificant")` which ensures backward compatibility -- existing encounters get the default tier. The column sits next to the pre-existing `significanceMultiplier` column, which is logically grouped. The ticket correctly notes "migration needed post-merge."

3. **Type system is well-structured.** The `SignificanceTier` type is defined once in `encounterBudget.ts` and imported into `encounter.ts` (types), `encounter.service.ts` (server), and the two modal components. The `Encounter` interface cleanly extends with `significanceTier: SignificanceTier`. The `ParsedEncounter` interface in the service mirrors this. The `EncounterRecord` interface correctly uses `string` (matching the raw DB type) and the response builder casts to `SignificanceTier` at the boundary.

4. **StartEncounterModal significance UI is clean.** The radio selector iterates `SIGNIFICANCE_PRESETS` with clear labels ("Insignificant (x1.0)", "Everyday (x2.0)", etc.) and descriptions. The `selectedTier` ref defaults to `'insignificant'`. The `handleConfirm` method emits the `defaultMultiplier` from the selected preset and the tier name. The modal is 238 lines -- well under the 800-line limit.

5. **GenerateEncounterModal significance is appropriately compact.** The "Encounter Significance" section uses a condensed label+multiplier layout (`significance-compact` class) instead of the full description cards used in StartEncounterModal. This is the right UX choice for wild encounter generation where significance is a secondary concern. Default is `'insignificant'` (x1.0), matching the PTU expectation that random wild encounters are x1.

6. **API consistency is solid across all 4 endpoints.** POST encounters (`index.post.ts`, `from-scene.post.ts`), PUT encounter (`[id].put.ts`), and the dedicated significance endpoint (`[id]/significance.put.ts`) all accept the same field names (`significanceMultiplier`, `significanceTier`) and apply the same defaults (`1.0`, `'insignificant'`). The dedicated endpoint adds proper validation for the multiplier range.

7. **Store actions follow existing patterns.** `createEncounter` and `createFromScene` both spread the significance fields conditionally (`...(significance && { ... })`), preserving backward compatibility for callers that don't pass significance. The `setSignificance` action updates local state immutably (`this.encounter = { ...this.encounter, ... }`). WebSocket sync in `updateFromWebSocket` guards both fields with `if (data.X !== undefined)`, matching the established pattern for optional fields.

8. **Parent page handlers are uniform.** All three pages (`encounter-tables.vue`, `habitats/[id].vue`, `habitats/index.vue`) forward significance from the `addToEncounter` emit to `encounterCreation.createWildEncounter()` with the same `significance?: { multiplier: number; tier: string }` parameter shape. The `useEncounterCreation` composable correctly passes it to `encounterStore.createEncounter()`.

9. **Scene-to-encounter pipeline is complete.** The `handleStartEncounter` in `[id].vue` receives significance from the StartEncounterModal's `confirm` emit, restructures it as `{ multiplier, tier }`, and passes it to `encounterStore.createFromScene()`. The store sends it to the `from-scene.post.ts` API. The API destructures `{ significanceMultiplier, significanceTier }` from the body and passes both to `prisma.encounter.create()`. The response builder includes both fields. The full roundtrip is verified.

10. **File sizes are within limits.** encounter.ts (745 lines), GenerateEncounterModal.vue (770 lines), [id].vue (732 lines) -- all under 800. The additions were modest: 42 lines to the store, 84 lines to GenerateEncounterModal, 54 lines to StartEncounterModal.

11. **Commit granularity is appropriate.** 9 commits for this scope is reasonable: 1 bug fix, 1 schema, 1 type+service, 2 UI modals, 1 API+store wiring, 1 scene integration, 1 scene page wiring, 1 docs. Each commit is focused on a single concern. The ordering makes sense -- schema first, types/service, then UI, then wiring, then integration.

12. **App-surface.md is updated.** The significance endpoint, modal components, and encounter model fields are documented. The entry correctly describes the significance lifecycle: "Set at encounter creation via StartEncounterModal/GenerateEncounterModal. Editable mid-encounter via significance.put endpoint."

## Verdict

**APPROVED** -- The C1 fix from code-review-134 is correctly resolved. The P1 significance multiplier feature is complete, well-structured, and follows project patterns. Two MEDIUM issues exist (loose typing in store actions, missing server-side tier validation) but neither causes runtime bugs or data corruption -- the UI constrains inputs to valid values. These should be addressed in a follow-up but do not block merging.

## Required Changes

None blocking. The following MEDIUM items should be filed as follow-up work:

| ID | Severity | Description | File(s) |
|----|----------|-------------|---------|
| M1 | MEDIUM | Replace `tier: string` with `tier: SignificanceTier` in store/composable function signatures; remove `as any` cast | `app/stores/encounter.ts`, `app/composables/useEncounterCreation.ts` |
| M2 | MEDIUM | Add server-side whitelist validation for `significanceTier` string values on all 4 encounter endpoints | `app/server/api/encounters/[id]/significance.put.ts`, `index.post.ts`, `from-scene.post.ts`, `[id].put.ts` |
