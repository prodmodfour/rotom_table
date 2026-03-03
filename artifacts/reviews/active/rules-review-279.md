---
review_id: rules-review-279
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-022
domain: pokemon-lifecycle
commits_reviewed:
  - cb89b8d9
  - bfa81656
  - 9e0bf8c9
  - b1ab6c93
  - aabbc668
  - 0f1b30e2
mechanics_verified:
  - loyalty-ranks
  - starting-loyalty-values
  - friend-ball-loyalty-bonus
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 2
ptu_refs:
  - core/05-pokemon.md#Loyalty (p.210-212)
  - core/09-gear-and-items.md#Friend Ball (p.279)
  - core/07-combat.md#Intercept (p.242)
reviewed_at: 2026-03-03T18:25:00Z
follows_up: null
---

## Mechanics Verified

### Loyalty Ranks (R048)

- **Rule:** "There are 7 Ranks of Loyalty, from 0 to 6" (`core/05-pokemon.md` p.210, line 1408)
- **Implementation:** Schema defines `loyalty Int @default(3)` in `app/prisma/schema.prisma` line 160. TypeScript type `loyalty: number` in `app/types/character.ts` line 188. UI component `PokemonStatsTab.vue` defines `loyaltyRanks` array with 7 entries mapping values 0-6 to labels Hostile/Resistant/Wary/Neutral/Friendly/Loyal/Devoted (lines 204-212).
- **Status:** CORRECT

The PTU rulebook does not assign canonical short names to ranks (it uses descriptive paragraphs), so the UI labels are implementation-chosen. They are consistent with the PTU descriptions:
- 0 "Hostile" matches "detest their trainers" (p.210)
- 1 "Resistant" matches "similarly dislike their trainer" (p.210)
- 2 "Wary" matches "like their trainer well enough but hold no particular fondness" (p.210)
- 3 "Neutral" matches "average loyalty for most Pokemon" (p.211)
- 4 "Friendly" matches "show fondness and respect" (p.211)
- 5 "Loyal" matches "true friends" (p.211)
- 6 "Devoted" matches "share a true bond" (p.211)

All 7 ranks are present. No ranks are missing or misnumbered.

### Starting Loyalty Values (R050)

- **Rule:** "Most caught wild Pokemon will begin at this Loyalty Rank" (rank 2, Wary) (`core/05-pokemon.md` p.210, line 1470). "most Pokemon hatched from eggs will bond easily with their Trainers as a parent figure and begin at this Loyalty Rank" (rank 3, Neutral) (`core/05-pokemon.md` p.211, lines 1500-1502). Default 3 is described as "the average loyalty for most Pokemon" (p.211, line 1491).
- **Implementation:** `getStartingLoyalty()` in `app/server/services/pokemon-generator.service.ts` (lines 202-208) returns 2 for `'captured'` and `'wild'` origins, 3 for all other origins (manual, template, import). Called by `createPokemonRecord()` at line 259.
- **Status:** CORRECT

The function correctly implements PTU RAW for the origin values that exist in the codebase (`PokemonOrigin = 'manual' | 'wild' | 'template' | 'import' | 'captured'`). The system does not currently support `'traded'` or `'bred'` origins, so those are out of scope. The default of 3 (Neutral) is correct for GM-created and imported Pokemon where origin-specific loyalty is undefined by the rules.

The `POST /api/pokemon` endpoint at line 68 uses `body.loyalty ?? 3`, allowing manual override for manually created Pokemon. This is acceptable since the GM is the final authority on loyalty per PTU RAW: "it is up to the GM to determine when a Pokemon's Loyalty Rank rises or falls" (p.212, line 1573-1574).

### Friend Ball +1 Loyalty Bonus

- **Rule:** "A caught Pokemon will start with +1 Loyalty." (`core/09-gear-and-items.md` p.279, line 107)
- **Implementation:** In `app/server/api/capture/attempt.post.ts` lines 190-201, when `ballDef.postCaptureEffect === 'loyalty_plus_one'`: reads `(pokemon as any).loyalty ?? 2`, adds 1, clamps to max 6 via `Math.min(6, currentLoyalty + 1)`, writes to DB.
- **Status:** CORRECT

The implementation correctly:
1. Reads the current loyalty from the DB record (which for wild Pokemon is 2 per `getStartingLoyalty`)
2. Adds exactly +1 per the Friend Ball text
3. Clamps to max 6 (prevents exceeding the 0-6 range)
4. Persists the updated value to the database
5. Reports the change in the post-capture effect description

The `?? 2` fallback is correct for the capture context because only wild/unowned Pokemon can be captured (enforced by the ownerId check at line 75), and wild Pokemon have starting loyalty 2.

The Friend Ball modifier of -5 to capture rate is correctly defined in `app/constants/pokeBalls.ts` line 204, matching PTU p.279 ("-5" modifier).

## Additional Observations

### Misleading JSDoc Comment (Not a Rule Violation)

The JSDoc comment for `getStartingLoyalty()` (lines 198-201) claims "Traded: 1 (Resistant), Bred/Egg: 4 (Friendly)". This is incorrect per PTU RAW:

- **Traded:** PTU 1.05 does not specify a starting loyalty for traded Pokemon. The concept does not appear in the loyalty section of Chapter 5 (pages 210-212). No errata addresses this either.
- **Bred/Egg:** PTU 1.05 explicitly says hatched eggs start at Loyalty **3** (Neutral), not 4 (Friendly): "most Pokemon hatched from eggs will bond easily with their Trainers as a parent figure and begin at this Loyalty Rank" (p.211, referring to rank 3).

However, neither 'traded' nor 'bred' are values in `PokemonOrigin`, and the switch statement does not handle them. The code behavior is correct (default returns 3, which is correct for bred). The comment is misleading but has no mechanical impact. This is a documentation issue, not a rules violation.

### `createdPokemonToEntity()` Hardcoded Loyalty

The function at line 335 hardcodes `loyalty: 3` instead of using the DB-persisted value or calling `getStartingLoyalty()`. This is noted in code-review-306 as CRITICAL (data divergence between DB and in-memory entity for encounter combatants). From a rules perspective:

This means a wild Pokemon spawned into an encounter will have `loyalty: 3` in its combatant entity but `loyalty: 2` in the database. While loyalty is not currently used by any combat mechanic (command checks and intercept gating are out of scope for this partial implementation), the divergence would produce incorrect behavior when those features are added. The code-review-306 critical finding covers the fix adequately; no additional rules-review finding needed.

### No Range Validation on API Endpoints

The `PUT /api/pokemon/:id` and `POST /api/pokemon` endpoints accept arbitrary loyalty values without validating the 0-6 range. Per PTU RAW, loyalty is strictly 0-6 (7 discrete ranks). Values outside this range are meaningless. Code-review-306 covers this as H1/H2. From a rules perspective, this is a data integrity concern — if loyalty exceeds 6 or goes below 0, it violates the fundamental definition that "There are 7 Ranks of Loyalty, from 0 to 6" (p.210).

## Summary

The loyalty system partial implementation correctly implements the PTU 1.05 rules within its declared scope (R048 ranks and R050 starting values). The 7 loyalty ranks are correctly numbered 0-6 with appropriate defaults. Starting values match the rulebook: captured/wild Pokemon at rank 2 (Wary), general default at rank 3 (Neutral). The Friend Ball +1 loyalty bonus is correctly applied post-capture with proper clamping.

No decrees apply to loyalty mechanics. No errata modifies the loyalty rules. The code accurately reflects the PTU 1.05 source material.

## Rulings

1. **Rank labels are acceptable UX additions.** The PTU rulebook uses only numeric ranks (0-6) without short names. The implementation's labels (Hostile, Resistant, Wary, Neutral, Friendly, Loyal, Devoted) are reasonable summarizations of the book's descriptive text and do not misrepresent any mechanic.

2. **Default loyalty of 3 for non-wild origins is correct.** PTU describes rank 3 as "the average loyalty for most Pokemon" (p.211). For GM-created, imported, and template Pokemon where the exact origin context is ambiguous, defaulting to the "average" rank is the correct interpretation.

3. **The `?? 2` fallback in capture context is correct.** Since only unowned (wild) Pokemon can be captured, and wild Pokemon have starting loyalty 2 per RAW, the fallback correctly matches the expected DB value in all valid capture scenarios.

## Issues

### HIGH

**H1: JSDoc comment in `getStartingLoyalty()` claims bred Pokemon start at Loyalty 4 (Friendly) — PTU RAW says Loyalty 3 (Neutral)**
File: `app/server/services/pokemon-generator.service.ts`, lines 198-200
Severity: HIGH (incorrect rules citation that could mislead future implementers)

The comment states: "Bred/Egg: 4 (Friendly)". PTU 1.05 p.211 lines 1499-1502 explicitly place hatched Pokemon at Loyalty 3: "It's also possible for a Pokemon to begin at Loyalty 3. For example, most Pokemon hatched from eggs will bond easily with their Trainers as a parent figure and begin at this Loyalty Rank."

When a `'bred'` origin is eventually added, a developer reading this comment would implement `case 'bred': return 4`, which would be wrong per RAW. The comment should be corrected to say "Bred/Egg: 3 (Neutral)" or removed entirely since these origins do not yet exist.

The "Traded: 1 (Resistant)" claim is similarly unsubstantiated — PTU 1.05 does not specify a starting loyalty for traded Pokemon anywhere in Chapter 5 (pages 210-212) or the errata. This claim should either be removed or flagged as a house rule requiring a decree.

### MEDIUM

**M1: No clamping on loyalty in Friend Ball DB write prevents theoretical over-cap**
File: `app/server/api/capture/attempt.post.ts`, line 196
Severity: MEDIUM (edge case)

The code uses `Math.min(6, currentLoyalty + 1)` (line 193) which correctly caps at 6. However, the DB write uses `data: { loyalty: newLoyalty } as any` (line 196). If `currentLoyalty` were somehow already above 6 (due to the missing validation on other endpoints), `Math.min(6, 7 + 1)` would correctly cap at 6. This is defensive enough. The root issue is the missing validation in H1/H2 from code-review-306, which this review concurs with.

**M2: Entity-builder and serializer fallbacks mask missing DB data rather than failing**
Files: `app/server/utils/serializers.ts` (lines 51, 242), `app/server/services/entity-builder.service.ts` (line 64)
Severity: MEDIUM (silent error masking)

All three locations use `(record as any).loyalty ?? 3` as a fallback. If the DB migration hasn't been run (`npx prisma db push`), pre-existing Pokemon records will have no `loyalty` column, and the fallback silently assigns 3 (Neutral). While 3 is a reasonable default per PTU rules, the silent behavior means data quality issues go undetected. After migration, this is no longer a concern. The `as any` casts are a necessary workaround until `npx prisma generate` is run post-merge, per code-review-306 H3.

## Verdict

**APPROVED** — The implemented mechanics are correct per PTU 1.05 rules. The loyalty ranks (0-6), starting values (wild/captured=2, default=3), and Friend Ball +1 bonus all match the source material. No formulas are wrong; no mechanics are missing within the declared scope.

The one HIGH finding (H1) is a documentation accuracy issue — the code itself behaves correctly, but the JSDoc comment contains an incorrect PTU citation (bred=4 instead of bred=3) that could mislead future work. This does not block the implementation but should be fixed.

The CRITICAL and HIGH issues identified in code-review-306 (entity divergence, input validation, `as any` removal) are engineering concerns rather than rules violations. This rules review concurs with those findings but does not duplicate them.

## Required Changes

1. **[HIGH] Correct the `getStartingLoyalty()` JSDoc** — Change "Bred/Egg: 4 (Friendly)" to "Bred/Egg: 3 (Neutral)" per PTU p.211. Either substantiate "Traded: 1 (Resistant)" with a PTU page citation or remove it and note it as a potential future decree-need.
