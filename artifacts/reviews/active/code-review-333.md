---
review_id: code-review-333
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-050
domain: combat
commits_reviewed:
  - c3b07416
files_reviewed:
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/utils/damageCalculation.ts
  - app/types/character.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T19:30:00Z
follows_up: null
---

## Review Scope

First review of bug-050: server-side `calculate-damage.post.ts` endpoint missing `moveKeywords` passthrough to `calculateDamage()`, which would prevent Living Weapon STAB exclusion (PTU p.287: weapon moves can never benefit from STAB).

Checked against decrees 001-048. decree-043 (Living Weapon skill rank gate) is in the Living Weapon domain but concerns skill rank gating for move access, not STAB calculation -- not applicable here. No decree violations.

## Issues

None.

## What Looks Good

1. **Fix is correct and minimal.** The single-line addition `moveKeywords: move.keywords,` at line 280 passes the move's keyword array into the `calculateDamage()` input object. The `DamageCalcInput` interface (damageCalculation.ts line 197) declares `moveKeywords?: string[]` as optional, so existing calls without the field continue to work (defaulting to no STAB exclusion, which is correct for non-weapon moves).

2. **Consumer logic verified.** The `calculateDamage()` function in `damageCalculation.ts` (line 333) checks `input.moveKeywords?.includes('Weapon')` and skips STAB when true. The optional chaining with `?? false` fallback means the field being previously absent caused the default behavior (STAB applied normally), which is incorrect for weapon moves. After this fix, weapon moves will correctly have their keywords passed through and STAB will be blocked.

3. **Data source verified.** The `move` object comes from `getEffectiveMoveList()` (line 192), which for Living Weapon wielded Pokemon includes the weapon moves with `keywords: ['Weapon']` set by the living-weapon service. The `Move` type in `character.ts` (line 59) declares `keywords?: string[]`. The chain is complete: service sets keywords, type declares them, endpoint passes them, calculator reads them.

4. **No other server-side call sites affected.** Verified all other `calculateDamage()` call sites in the server: `move.post.ts`, `next-turn.post.ts`, `aoo-resolve.post.ts`, `damage.post.ts`, and `turn-helpers.ts` all call the *different* `calculateDamage` from `combatant.service.ts` (which handles HP reduction arithmetic, not the 9-step damage formula). The `calculate-damage.post.ts` endpoint is the sole server-side caller of the 9-step `calculateDamage` from `utils/damageCalculation.ts`.

5. **Defensive correctness.** Even though the bug is currently not triggerable (Honedge line: Steel/Ghost types, weapon moves are Normal type, so STAB never matches), the fix is the right call. Future Living Weapon species with type-matching weapon moves would silently receive incorrect bonus damage without this fix. Per review philosophy: fix it now while the developer is in the code.

6. **PTU rules compliance.** PTU p.287 states weapon moves "can never benefit from STAB." The implementation at damageCalculation.ts line 332-334 correctly blocks STAB for any move with the Weapon keyword. This fix ensures the server-side path honors that rule identically to any client-side path.

## Verdict

**APPROVED** -- Correct single-line fix for a latent rules compliance bug. The data flow chain is verified end-to-end. No regressions possible (optional field with safe default). bug-050 is ready to close.
