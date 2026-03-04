---
review_id: rules-review-282
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-022
domain: pokemon-lifecycle
commits_reviewed:
  - a37f58d7
  - c4c55d7f
  - 27ffd8a3
  - 4b8204ae
  - 4bff0cf0
  - 8432655d
mechanics_verified:
  - loyalty-ranks
  - starting-loyalty-values
  - friend-ball-loyalty-bonus
  - loyalty-range-validation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Loyalty (p.210-212)
  - core/09-gear-and-items.md#Friend Ball (p.279)
reviewed_at: 2026-03-03T20:45:00Z
follows_up: rules-review-279
---

## Mechanics Verified

### Loyalty Ranks (R048)

- **Rule:** "There are 7 Ranks of Loyalty, from 0 to 6" (`core/05-pokemon.md` p.210, line 1408)
- **Implementation:** Schema defines `loyalty Int @default(3)` in `app/prisma/schema.prisma` line 160. TypeScript type `loyalty: number` in `app/types/character.ts` line 188. UI dropdown in `PokemonStatsTab.vue` lines 204-212 maps values 0-6 to labels Hostile/Resistant/Wary/Neutral/Friendly/Loyal/Devoted.
- **Status:** CORRECT (unchanged from rules-review-279; no fix cycle commits modified rank definitions)

### Starting Loyalty Values (R050)

- **Rule:** "Most caught wild Pokemon will begin at this Loyalty Rank" (rank 2, Wary) (`core/05-pokemon.md` p.210, line 1470). "most Pokemon hatched from eggs will bond easily with their Trainers as a parent figure and begin at this Loyalty Rank" (rank 3, Neutral) (`core/05-pokemon.md` p.211, lines 1500-1502).
- **Implementation:** `getStartingLoyalty()` in `app/server/services/pokemon-generator.service.ts` lines 198-204 returns 2 for `'captured'` and `'wild'` origins, 3 for all others. Called by `createPokemonRecord()` at line 259 (DB write) and `createdPokemonToEntity()` at line 336 (in-memory entity).
- **Status:** CORRECT

**Fix verification (C1 from code-review-306 / related to M2 from rules-review-279):** Commit a37f58d7 added `origin: PokemonOrigin` to the `CreatedPokemon` interface (line 75) and changed `createdPokemonToEntity()` from the hardcoded `loyalty: 3` to `loyalty: getStartingLoyalty(pokemon.origin)` at line 336. The `CreatedPokemon` returned by `createPokemonRecord()` now includes `origin: input.origin` (line 269). This means the in-memory entity constructed for encounter combatants via `buildPokemonCombatant()` will have the same loyalty value as the DB record. A wild Pokemon will correctly have loyalty 2 in both the DB and the combatant entity.

The same commit also fixed `shiny: false` to `shiny: data.shiny ?? false` (line 337) and `origin: 'wild'` to `origin: pokemon.origin` (line 340), eliminating two additional data divergence issues in the entity builder.

### Friend Ball +1 Loyalty Bonus

- **Rule:** "A caught Pokemon will start with +1 Loyalty." (`core/09-gear-and-items.md` p.279, line 107)
- **Implementation:** In `app/server/api/capture/attempt.post.ts` lines 190-201: reads `(pokemon as any).loyalty ?? 2`, adds 1, clamps to max 6 via `Math.min(6, currentLoyalty + 1)`, writes to DB.
- **Status:** CORRECT (unchanged from rules-review-279)

The Friend Ball implementation remains correct. The `?? 2` fallback is appropriate because only unowned (wild) Pokemon can be captured (enforced by the ownerId check at line 75), and wild Pokemon have starting loyalty 2 per `getStartingLoyalty('wild')`. The `Math.min(6, ...)` clamp prevents exceeding the 0-6 range.

### Loyalty Range Validation

- **Rule:** "There are 7 Ranks of Loyalty, from 0 to 6" (`core/05-pokemon.md` p.210) -- values outside 0-6 are undefined by the rules.
- **Implementation:** Both API endpoints now validate loyalty before writing to DB:
  - `PUT /api/pokemon/[id].put.ts` lines 50-58: validates `Number.isInteger(body.loyalty) && body.loyalty >= 0 && body.loyalty <= 6`, throws 400 error on violation.
  - `POST /api/pokemon/index.post.ts` lines 17-24: validates the resolved `loyalty` value (from `body.loyalty ?? 3`) with the same integer + range check, throws 400 error on violation.
- **Status:** CORRECT

The validation correctly enforces the PTU constraint that loyalty is a discrete integer in the range [0, 6]. Non-integer values (e.g., 3.5), negative values, and values above 6 are all rejected with a clear error message. This prevents the database from containing meaningless loyalty values that violate the fundamental 7-rank definition.

## Prior Issue Resolution

### rules-review-279 H1: RESOLVED

The stale JSDoc that claimed "Bred/Egg: 4 (Friendly)" and "Traded: 1 (Resistant)" was fixed in commit c4c55d7f. The `getStartingLoyalty()` JSDoc now reads:

```
Map Pokemon origin to starting loyalty value (PTU Chapter 10, p.211).
Captured/wild: 2 (Wary), Default (manual/template/import): 3 (Neutral).
```

This accurately reflects the implemented behavior and aligns with PTU RAW:
- Captured/wild at rank 2 matches "Most caught wild Pokemon will begin at this Loyalty Rank" (p.210, referring to rank 2 Wary).
- Default of 3 matches "Loyalty 3 Pokemon is the average loyalty for most Pokemon" (p.211).
- The unsubstantiated claims about traded (1) and bred (4) origins have been removed entirely.
- The `page 211` citation is now included, providing a verifiable reference.

The orphaned JSDoc block for `createPokemonRecord()` (which was erroneously placed above `getStartingLoyalty()`) was also relocated in the same commit. The `createPokemonRecord()` function now has its own correct JSDoc at lines 206-208.

### rules-review-279 M1: RESOLVED (by transitive fix)

The original M1 noted that while `Math.min(6, ...)` correctly capped the Friend Ball loyalty bonus, the root issue was missing validation on other endpoints that could allow loyalty values above 6 in the first place. Commits 27ffd8a3 and 4b8204ae added range validation to PUT and POST endpoints respectively, closing the upstream path that could have led to over-cap values.

### rules-review-279 M2: ACKNOWLEDGED (documented tech debt)

The `?? 3` fallbacks in `entity-builder.service.ts` (line 64), `serializers.ts` (lines 51, 242), and the `as any` casts remain as pre-migration workarounds. Commit 4bff0cf0 documented all 5 `as any` locations in the feature-022 ticket with explicit removal instructions for post-merge. This is the expected state until `npx prisma generate` runs in the main repo. The fallback value of 3 (Neutral) is correct per PTU RAW for pre-existing Pokemon that predate the loyalty column.

## Decree Check

Scanned all 44 active decrees (decree-001 through decree-044). Two decrees in the `pokemon-lifecycle` domain (decree-035: base relations ordering, decree-036: stone evolution moves) do not pertain to loyalty mechanics. No decrees govern loyalty starting values, rank definitions, or Friend Ball behavior. No decree violations found.

## Errata Check

Searched `books/markdown/errata-2.md` for "loyalty" and "Loyalty" -- no matches. The loyalty system has no errata modifications. The core text (PTU 1.05 Chapter 5, pages 210-212) is the authoritative source.

## Summary

All issues from rules-review-279 (1 HIGH, 2 MEDIUM) have been resolved by the fix cycle:

| rules-review-279 Issue | Fix Commit | Verification |
|------------------------|------------|--------------|
| H1: JSDoc claims bred=4, PTU says bred=3 | c4c55d7f | JSDoc corrected to cite only implemented origins with PTU page reference |
| M1: No clamping edge case on Friend Ball | 27ffd8a3, 4b8204ae | Root cause fixed: upstream endpoints now validate 0-6 range |
| M2: Fallbacks mask missing DB data | 4bff0cf0 | Documented as post-merge tech debt with explicit removal checklist |

The code-review-306 issues that have rules implications have also been verified:

| code-review-306 Issue | Rules Impact | Fix Commit | Verification |
|----------------------|-------------|------------|--------------|
| C1: Entity loyalty divergence | Wild Pokemon show loyalty 3 instead of 2 in encounters | a37f58d7 | Entity builder now calls `getStartingLoyalty(pokemon.origin)` |
| H1+H2: No range validation | API accepts values outside 0-6, violating rank definition | 27ffd8a3, 4b8204ae | Both endpoints validate integer in [0, 6] |

## Rulings

1. **All prior rulings from rules-review-279 remain valid.** Rank labels (Hostile through Devoted) are acceptable UX additions. Default loyalty of 3 for non-wild origins is correct. The `?? 2` fallback in capture context is correct.

2. **The corrected JSDoc accurately represents PTU RAW.** The new documentation cites only the origins actually implemented in the codebase and provides the correct PTU page reference (p.211). Future origins (traded, bred) are appropriately omitted since they are out of scope and documented in the ticket.

3. **Server-side range validation correctly enforces the PTU rank constraint.** The 7-rank system (0-6) is a hard boundary per RAW, and rejecting out-of-range values with a 400 error is the correct behavior for an API trust boundary.

## Verdict

**APPROVED** -- All rules-review-279 issues (1H, 2M) have been resolved. The loyalty system correctly implements PTU 1.05 rules within its declared scope:

- 7 loyalty ranks (0-6) with correct labels
- Starting values: captured/wild = 2 (Wary), default = 3 (Neutral) per PTU p.210-211
- Friend Ball +1 loyalty bonus with proper clamping per PTU p.279
- Server-side validation enforces the 0-6 range constraint
- Entity builder no longer diverges from DB on loyalty values
- JSDoc accurately reflects PTU RAW citations

No new issues found. No decree violations. No errata conflicts.

## Required Changes

None.
