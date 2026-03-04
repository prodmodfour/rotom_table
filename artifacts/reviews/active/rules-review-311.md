---
review_id: rules-review-311
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-047
domain: capture
commits_reviewed:
  - 38e637ad
  - c4783211
  - 2f65132a
mechanics_verified:
  - loyalty-fallback-defaults
  - friend-ball-post-capture
  - intercept-loyalty-check
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/05-pokemon.md#Loyalty
  - core/09-gear-and-items.md#Friend-Ball
  - core/07-combat.md#Intercept
reviewed_at: 2026-03-04T22:30:00Z
follows_up: null
---

## Mechanics Verified

### Loyalty Fallback Default (Schema Consistency)

- **Rule:** "A Pokemon's Loyalty is a secret value kept by the GM. There are 7 Ranks of Loyalty, from 0 to 6." (`core/05-pokemon.md#Loyalty`)
- **Schema:** `loyalty Int @default(3)` (`app/prisma/schema.prisma:160`) with comment `3=Neutral`
- **Implementation:** All 8 `loyalty ??` sites in the codebase now use `?? 3`, matching the schema default. Two were fixed: `attempt.post.ts` (was `?? 2`) and `intercept.service.ts` (was `?? 0`).
- **Status:** CORRECT — Fallbacks are internally consistent with the schema default.

### Friend Ball Post-Capture Effect

- **Rule:** "A caught Pokemon will start with +1 Loyalty." (`core/09-gear-and-items.md:107`)
- **Implementation:** `attempt.post.ts:209-220` — On successful capture with Friend Ball (`postCaptureEffect === 'loyalty_plus_one'`), reads `pokemon.loyalty ?? 3`, adds 1, clamps to `Math.min(6, currentLoyalty + 1)`, persists via `prisma.pokemon.update`.
- **Status:** CORRECT — The +1 Loyalty logic is accurate. Upper bound of 6 correctly prevents exceeding max loyalty. With the fixed fallback of 3 (Neutral), a Friend Ball capture yields Loyalty 4 (Friendly), which is the expected behavior per PTU rules for a Pokemon starting at Neutral.

### Intercept Loyalty Check

- **Rule:** "Pokemon must have a Loyalty of 3 or greater to make Intercept Melee and Intercept Range Maneuvers, and may only Intercept attacks against their Trainer. At Loyalty 6, Pokemon may Intercept for any Ally." (`core/07-combat.md:1279-1282`)
- **Implementation:** `intercept.service.ts:111-129` — `checkInterceptLoyalty` checks `loyalty < 3` (block), `loyalty < 6` (trainer-only), otherwise allows any ally intercept.
- **Status:** CORRECT — The loyalty thresholds (3 for trainer, 6 for any ally) match PTU RAW exactly. The previous fallback of `?? 0` was dangerous: if loyalty data was missing, the Pokemon would be incorrectly blocked from intercepting. The fix to `?? 3` ensures a missing loyalty value defaults to Neutral, which permits trainer-only intercepts.

### Codebase Audit Completeness

The developer's audit (commit `2f65132a`) identified all 8 `loyalty ??` sites across the codebase. Independent verification via `grep` confirms no additional sites exist. The audit also correctly noted the design spec (`spec-p2.md:338`) containing `?? 0` as a non-runtime reference.

**Verified sites (all use `?? 3`):**

| File | Line | Fallback | Status |
|------|------|----------|--------|
| `app/server/api/capture/attempt.post.ts` | 211 | `?? 3` | Fixed (was `?? 2`) |
| `app/server/services/intercept.service.ts` | 118 | `?? 3` | Fixed (was `?? 0`) |
| `app/server/utils/serializers.ts` | 51 | `?? 3` | Already correct |
| `app/server/utils/serializers.ts` | 242 | `?? 3` | Already correct |
| `app/server/api/pokemon/index.post.ts` | 18 | `?? 3` | Already correct |
| `app/server/services/entity-builder.service.ts` | 64 | `?? 3` | Already correct |
| `app/components/pokemon/PokemonStatsTab.vue` | 136 | `?? 3` | Already correct |
| `app/components/pokemon/PokemonStatsTab.vue` | 214 | `?? 3` | Already correct |

Audit is complete. All sites accounted for.

## Summary

The bug fix correctly harmonizes all loyalty nullish coalescing fallbacks to match the schema default of 3 (Neutral). Both fixed sites had incorrect fallback values:

1. **`attempt.post.ts`** used `?? 2` (Wary) — caused Friend Ball to grant +1 from Loyalty 2 instead of 3, resulting in Loyalty 3 instead of the intended 4. This made the Friend Ball less beneficial than designed.
2. **`intercept.service.ts`** used `?? 0` (Hostile) — if loyalty data was null, the Pokemon would be blocked from intercepting entirely, even though a null loyalty should default to Neutral (3), which permits trainer-only intercepts.

The developer performed a thorough codebase audit (Lesson #2 compliance), verifying all 8 `loyalty ??` sites. The audit is complete and accurate.

## Rulings

### MED-001: Schema Default vs PTU RAW for Wild Pokemon Starting Loyalty

PTU RAW states: "Most caught wild Pokemon will begin at this Loyalty Rank" referring to Loyalty 2 (Wary) (`core/05-pokemon.md:1470`). However, the schema uses `@default(3)` (Neutral). This is a pre-existing design decision that predates bug-047 and was not introduced by these commits.

The fix is correct in harmonizing fallbacks to the schema default. Whether the schema default itself should be 2 or 3 is a separate question that warrants a decree. The current behavior (default 3 = Neutral) is more generous than PTU RAW but aligns with the app's existing data model.

**Recommendation:** File a `decree-need` ticket to formalize the choice of Loyalty 3 as the application default for newly caught wild Pokemon, acknowledging the deviation from PTU RAW's suggestion of Loyalty 2.

## Verdict

**APPROVED** — All three commits are correct. The loyalty fallback values are now internally consistent with the schema default. The Friend Ball +1 Loyalty logic and Intercept loyalty checks both implement PTU rules correctly. The codebase audit is complete.

One MEDIUM observation (MED-001) noted regarding the schema default vs PTU RAW, but this is a pre-existing design choice outside the scope of this bug fix.

## Required Changes

None. All changes are correct.
