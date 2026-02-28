---
review_id: rules-review-195
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-122+ptu-rule-123
domain: healing+encounter-tables
commits_reviewed:
  - 9f03df5
  - 06d4a67
  - cd7061d
  - f5a6a22
  - 3c67187
  - 6c23966
  - 7f2a874
mechanics_verified:
  - rest-healing
  - significance-tiers
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#resting
  - core/11-running-the-game.md#significance
decrees_checked:
  - decree-029
  - decree-030
reviewed_at: 2026-02-28T13:45:00Z
follows_up: null
---

## Mechanics Verified

### 1. Rest Healing (ptu-rule-122)

- **Rule:** "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points." (`core/07-combat.md`, Page 252)
- **Decree:** decree-029 rules that rest healing has a minimum of 1 HP per rest period, as a house-rule extension for usability.
- **Implementation:** `calculateRestHealing()` in `app/utils/restHealing.ts:66` uses `Math.max(1, Math.floor(maxHp / 16))`. The display function `getRestHealingInfo()` at line 175 applies the same formula for `hpPerRest`.
- **Status:** CORRECT

**Detailed verification:**

1. **Formula accuracy:** `Math.floor(maxHp / 16)` correctly computes 1/16th of Maximum Hit Points with floor rounding. The `Math.max(1, ...)` wrapper correctly enforces decree-029's minimum 1 HP floor.

2. **Uses real maxHp, not effective maxHp:** The code passes `maxHp` (the real maximum) to the 1/16th formula, NOT `effectiveMax` (injury-reduced). This is correct per PTU Core p.251: "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum."

3. **Healing cap uses effective max:** The subsequent line `Math.min(healAmount, effectiveMax - currentHp)` correctly caps actual healing at the injury-reduced effective maximum. PTU Core p.251: "a Pokemon with 3 injuries and 50 Max Hit Points could only heal up to 35 Hit Points."

4. **Both code paths updated:** The minimum floor is applied in both `calculateRestHealing()` (the actual healing function used by API endpoints) and `getRestHealingInfo()` (the display/info function used by UI). These are the only two locations in the codebase where the 1/16th formula appears.

5. **Server endpoints delegate correctly:** All four rest API endpoints (`pokemon/[id]/rest.post.ts`, `characters/[id]/rest.post.ts`, `pokemon/[id]/extended-rest.post.ts`, `characters/[id]/extended-rest.post.ts`) call the shared `calculateRestHealing()` utility. No endpoint duplicates the formula independently. The minimum floor is automatically inherited.

6. **Edge case: over-heal prevention:** The `currentHp >= effectiveMax` check (line 60) prevents healing when already at full effective HP. Even with the minimum 1 HP floor, the `Math.min(healAmount, effectiveMax - currentHp)` cap on line 68 prevents over-healing.

7. **Extended rest loop correctness:** Extended rest endpoints iterate calling `calculateRestHealing()` per 30-minute period. Each iteration recalculates with updated `currentHp` and `currentRestMinutes`, so the minimum floor correctly applies to each individual rest period without accumulation errors.

8. **Test coverage:** 4 new test cases cover the decree-029 minimum floor: low maxHp (10), Shedinja-level (14), extreme edge (maxHp=1), and over-heal prevention. The existing test was correctly updated from expecting `hpHealed: 0` to `hpHealed: 1`. A separate `getRestHealingInfo` test suite confirms the display function reports the correct `hpPerRest` value.

9. **Errata check:** No errata corrections apply to the base rest healing formula. The errata modifies the Nurse feature (1/8th instead of 1/16th), which is a separate mechanic not affected by this change.

### 2. Significance Tier Presets (ptu-rule-123)

- **Rule:** "The Significance Multiplier should range from x1 to about x5" (`core/11-running-the-game.md`, Page 460)
- **Decree:** decree-030 rules to cap significance presets at x5 per PTU RAW, removing climactic (x6) and legendary (x8). Custom input remains available.
- **Implementation:** `SIGNIFICANCE_PRESETS` in `app/utils/encounterBudget.ts` now contains only 3 tiers: insignificant (x1), everyday (x2), significant (x5). The `SignificanceTier` type union was narrowed to match. Server-side validation in `significance-validation.ts` accepts only these 3 tiers.
- **Status:** CORRECT

**Detailed verification:**

1. **Presets match PTU range:** The three remaining tiers (insignificant x1, everyday x2, significant x5) fall within the PTU-stated "x1 to about x5" range. The "about" qualifier reasonably permits x5 as the upper bound.

2. **Significant tier default multiplier changed from x4 to x5:** Previously `significant` defaulted to x4.0 with a range of 4.0-4.99. Now it defaults to x5.0 with a range of 4.0-5.0. This is correct per PTU p.460 which describes the highest tier (championship battles, legendary encounters) as warranting x5. The description now includes "legendary battles, arc finales" to absorb the narratives previously covered by the removed climactic/legendary tiers.

3. **Type narrowing:** `SignificanceTier` union type in `encounterBudget.ts:43` was correctly narrowed from `'insignificant' | 'everyday' | 'significant' | 'climactic' | 'legendary'` to `'insignificant' | 'everyday' | 'significant'`. This ensures compile-time safety across all consumers.

4. **Server-side validation:** `VALID_SIGNIFICANCE_TIERS` in `significance-validation.ts` was updated to match the narrowed type (3 values). The `validateSignificanceTier()` function is called by 4 API endpoints: `encounters/index.post.ts`, `encounters/from-scene.post.ts`, `encounters/[id].put.ts`, and `encounters/[id]/significance.put.ts`. Old tier values (climactic, legendary) sent by stale clients will now receive a 400 error.

5. **Experience calculation derived presets:** `SIGNIFICANCE_PRESETS` in `experienceCalculation.ts` is derived from the canonical `BUDGET_PRESETS` via `Object.fromEntries(BUDGET_PRESETS.map(...))`. This single-source-of-truth pattern ensures the experience calculation system automatically reflects the updated presets without independent maintenance.

6. **Custom input preserved:** Both `SignificancePanel.vue` and `XpDistributionModal.vue` retain the "Custom" option in their select dropdowns with a numeric input (min 0.5, max 10, step 0.5). GMs who want values above x5 can still enter them manually, per decree-030's ruling.

7. **Backwards compatibility for existing DB data:** Encounters stored with `significanceTier: 'climactic'` or `'legendary'` in the database will resolve to `'custom'` via `resolvePresetFromMultiplier()`, since the stored `significanceMultiplier` (6.0 or 8.0) won't match any preset. The UI will show "Custom" with the numeric value. The `significanceTier` string column in the DB is not constrained by an enum, so old values won't cause database errors.

8. **Prisma schema comment updated:** The `significanceTier` column comment in `schema.prisma` was updated to reflect the capped tier list and decree-030 reference.

9. **Errata check:** No errata corrections apply to significance multipliers or XP calculation.

## Summary

Both fixes correctly implement their respective decree rulings:

- **ptu-rule-122:** The `Math.max(1, ...)` wrapper on the 1/16th rest healing formula is the minimal, correct change. It is applied at both code paths (calculation and display), all server endpoints inherit the fix through the shared utility, and the existing over-heal cap prevents the minimum floor from causing HP overflow. The decree-029 citation is present in code comments.

- **ptu-rule-123:** The removal of climactic and legendary presets brings the app into compliance with PTU Core p.460. The type system, server validation, and UI all consistently reflect the narrowed preset list. The single-source-of-truth pattern in `encounterBudget.ts` ensures the derived `experienceCalculation.ts` presets stay synchronized. Backwards compatibility with existing DB records is handled gracefully via the `resolvePresetFromMultiplier()` fallback to 'custom'.

## Rulings

No new ambiguities discovered. Both implementations strictly follow their governing decrees.

- Per decree-029, the minimum 1 HP floor is correctly applied as a house-rule extension. The PTU RAW text does not specify a minimum, but the decree explicitly overrides this.
- Per decree-030, presets are capped at x5. The "significant" tier's default multiplier increase from x4 to x5 is a reasonable rebalancing to absorb the narrative space previously covered by the removed climactic tier, and x5 is explicitly within the PTU-stated range.

## Verdict

**APPROVED** -- Both fixes are mechanically correct, properly scoped, well-tested, and compliant with their governing decrees. No PTU rule violations found.

## Required Changes

None.
