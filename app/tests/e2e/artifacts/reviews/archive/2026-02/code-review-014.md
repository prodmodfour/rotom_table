---
review_id: code-review-014
target: refactoring-010
type: implementation-review
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-16T23:30:00
follows_up: code-review-013
reviewed_commits:
  - 96fd6e2
  - 11ad0ff
  - 0a5d6ba
  - 6d67ac4
reviewed_files:
  - app/prisma/schema.prisma
  - app/prisma/seed.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/services/grid-placement.service.ts
  - app/server/api/encounters/[id]/wild-spawn.post.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/from-scene.post.ts
  - app/server/api/encounter-templates/[id]/load.post.ts
scenarios_to_rerun: []
---

## Summary

Implementation review for refactoring-010 (Pokemon size capability for VTT token sizing). 4 commits, 6 files changed, 29 insertions / 14 deletions. The worker followed the approved plan from code-review-013 and correctly addressed MEDIUM #1 (don't add `size` to combatant entity capabilities type).

## Verification

### Commit 1: `96fd6e2` — add size column to SpeciesData and parse from pokedex

- **Schema:** `size String @default("Medium")` added after `capabilities` in SpeciesData model. Correct default.
- **Seed regex:** `/Height\s*:\s*[^(]*\((Small|Medium|Large|Huge|Gigantic)\)/i` — verified against 8 species across gen1/gen4/gen5/gen6/gen7/gen8. Handles both `Height :` (gen1-5) and `Height:` (gen7-8) formatting variants via `\s*`.
- **Normalization:** `charAt(0).toUpperCase() + slice(1).toLowerCase()` — correct, since regex is case-insensitive.
- **SpeciesRow interface:** `size: string` added. Included in `species.push()` and upsert data.
- **Fallback:** `'Medium'` when no Height match found. Correct.

### Commit 2: `11ad0ff` — include size in GeneratedPokemonData and capabilities JSON

- **Interface:** `size: string` added to `GeneratedPokemonData` (line 57).
- **generatePokemonData():** Default `let size = 'Medium'` (line 89). Set from `speciesData.size || 'Medium'` (line 113). Included in return object (line 150).
- **createPokemonRecord():** `size: data.size` added to capabilities JSON (line 193). This populates the DB record so `combatants.post.ts:44-45` (`sizeToTokenSize(capabilities.size)`) now receives real data.
- **MEDIUM #1 from plan review:** Correctly handled. `size` is NOT added to `CombatantData.entity.capabilities` type (line 269 — unchanged). It IS added to the DB record's capabilities JSON (line 190-194). These are different data structures serving different purposes.

### Commit 3: `0a5d6ba` — derive tokenSize in buildPokemonCombatant

- **Signature change:** Removed `tokenSize: number = 1` parameter. Now takes 3 args: `pokemon`, `side`, `position?`.
- **Import:** `sizeToTokenSize` imported from `grid-placement.service.ts`.
- **Derivation:** `const tokenSize = sizeToTokenSize(data.size)` (line 287). Uses the same mapping function already validated in grid-placement.service.ts.

### Commit 4: `6d67ac4` — remove manual tokenSize from callers

- **wild-spawn.post.ts:** Added `sizeToTokenSize` import. Changed `const tokenSize = 1` to `sizeToTokenSize(created.data.size)`. Removed 4th arg from `buildPokemonCombatant`. Local `tokenSize` retained for `findPlacementPosition` call.
- **from-scene.post.ts:** Same pattern as wild-spawn. Correct.
- **load.post.ts:** Removed `tc.tokenSize || 1` from `buildPokemonCombatant` call. Template position (`tc.position`) still passed through.

### Cross-cutting checks

- **All callers updated:** Confirmed exactly 3 call sites for `buildPokemonCombatant`: wild-spawn, from-scene, load. All updated.
- **combatants.post.ts:** Unchanged — already reads `capabilities.size` from DB record at line 44-45. Now receives real data instead of `undefined`.
- **Template round-trip:** Templates save `tokenSize` from encounter combatants. On load, `buildPokemonCombatant` re-derives tokenSize from species data. Not a regression — saved tokenSize was always 1 (size was never populated before). Re-derivation produces the correct value.
- **Human combatants in templates:** Still use saved `tc.tokenSize || 1` (load.post.ts:91). Unaffected.
- **PTU size mapping:** Small→1, Medium→1, Large→2, Huge→3, Gigantic→4. Matches PTU 1.05 Chapter 9. Matches existing `sizeToTokenSize` function.
- **Size distribution sanity:** 403+348+96+28+14 = 889 species with parsed sizes. Reasonable for ~890 parseable species across 994 pokedex files.

## Issues

None.

## What Looks Good

- Clean separation: DB capabilities JSON has `size` for persistence; combatant entity type does not. Two different data models for two different purposes.
- Regex handles cross-generational formatting differences without fragility.
- Each commit is independently working. Good granularity for a medium-scope refactoring.
- `combatants.post.ts` auto-fix identification saved an unnecessary code change.
- Worker correctly followed MEDIUM #1 guidance from plan review.

## Verdict

**APPROVED** — Clean implementation, 0 issues. Proceed to Game Logic Reviewer for PTU rule correctness verification.
