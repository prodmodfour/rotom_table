---
review_id: rules-review-060
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-027
domain: encounter-tables
commits_reviewed:
  - dc65a10
files_reviewed:
  - app/server/api/encounter-tables/[id]/generate.post.ts
  - app/components/habitat/GenerateEncounterModal.vue
  - app/components/encounter-table/ModificationCard.vue
mechanics_verified:
  - spawn-count-range-validity
  - density-multiplier-capping
  - max-spawn-count-enforcement
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/11-running-the-game.md#Encounter Creation Guide (p.473-476)
reviewed_at: 2026-02-20T14:00:00
---

## Review Scope

Reviewing commit `dc65a10` which clamps `scaledMin` to not exceed `scaledMax` in spawn range calculations. The bug occurred when a density multiplier pushed the scaled minimum above `MAX_SPAWN_COUNT` (e.g., abundant 12-16 with 2.0x multiplier: rawMin=24 > scaledMax=16), causing the random range formula to produce spawn counts exceeding the intended cap.

## PTU Rulebook Reference

PTU 1.05 Chapter 11 ("Running the Game") does **not** define formal density tiers, spawn count ranges, or density multipliers. As established in rules-review-055:

1. **Encounter Building (p.473):** The GM distributes total available levels across enemy Pokemon. The worked example uses 6 Pokemon for everyday encounters. No numerical formula for "how many Pokemon" is prescribed.

2. **Action Economy Warning (p.473):** "A large swarm of low Level foes can quickly overwhelm even the strongest of parties. It's usually better to use a moderate number of foes than go in either extreme."

3. **Swarm Template (p.476):** For 12+ Pokemon, the Swarm Template abstracts them into a single entity. Swarm Multiplier 1 = < 12 Pokemon, up to Multiplier 5 = 60+ Pokemon.

4. **No maximum encounter size defined.** PTU has no hard cap on the number of individual Pokemon in an encounter. The density tier system (`sparse`, `moderate`, `dense`, `abundant`) and `DENSITY_RANGES` constant are entirely app-defined homebrew.

**Key takeaway:** Since the entire density/spawn-count system is app-defined homebrew, this review focuses on internal consistency (does the code do what the app's own constants intend?) rather than PTU compliance (there are no PTU rules to violate here).

## Mechanics Verified

### 1. Spawn Count Range Validity

- **Rule (app-defined):** `DENSITY_RANGES` in `app/types/habitat.ts` defines: sparse (2-4), moderate (4-8), dense (8-12), abundant (12-16). `MAX_SPAWN_COUNT` is derived as the maximum of all tier maxes = 16.
- **Bug:** When `densityMultiplier` scales `range.min` above `MAX_SPAWN_COUNT`, the formula `Math.floor(Math.random() * (scaledMax - scaledMin + 1)) + scaledMin` produces a negative range argument because `scaledMax < scaledMin`. With `scaledMin=24` and `scaledMax=16`, the expression becomes `Math.random() * (16 - 24 + 1) + 24 = Math.random() * (-7) + 24`, yielding values from 17 to 24 -- all above the cap.
- **Fix:** Introduces `rawMin = Math.max(1, Math.round(range.min * multiplier))`, then clamps with `scaledMin = Math.min(rawMin, scaledMax)`. When rawMin exceeds scaledMax, the range collapses to `[scaledMax, scaledMax]`, producing exactly `MAX_SPAWN_COUNT`.
- **Status:** CORRECT
- **Notes:** The clamping preserves three invariants: (1) scaledMin >= 1, (2) scaledMax <= MAX_SPAWN_COUNT, (3) scaledMin <= scaledMax. All three are necessary for a valid random range.

### 2. Density Multiplier Capping Behavior

- **Rule (app-defined):** The density multiplier scales the base density range. UI presets go up to 2.0x; the server API accepts up to 5.0x per the ticket notes.
- **Implementation:** After the fix, extreme multipliers are handled gracefully:
  - **abundant (12-16) x 2.0:** rawMin=24, scaledMax=16 -> scaledMin=16. Result: always 16. Correct -- the maximum density possible.
  - **dense (8-12) x 2.0:** rawMin=16, scaledMax=16 -> scaledMin=16. Result: always 16. Correct.
  - **moderate (4-8) x 2.0:** rawMin=8, scaledMax=16 -> scaledMin=8. Result: 8-16. Correct -- within bounds.
  - **sparse (2-4) x 5.0:** rawMin=10, scaledMax=16 -> scaledMin=10. Result: 10-16. Correct.
  - **abundant (12-16) x 0.5:** rawMin=6, scaledMax=8 -> scaledMin=6. Result: 6-8. Correct.
- **Status:** CORRECT
- **Notes:** The fix handles all multiplier magnitudes correctly. The key insight is that `scaledMax` is always capped first (via `Math.min(MAX_SPAWN_COUNT, ...)`), and then `scaledMin` is clamped to never exceed it. This order of operations ensures a valid range regardless of multiplier value.

### 3. MAX_SPAWN_COUNT Enforcement

- **Rule (app-defined):** No spawn count should exceed `MAX_SPAWN_COUNT` (16).
- **Implementation:** The fix ensures both display and generation respect the cap:
  - **Server generation** (`generate.post.ts`): `scaledMin` clamped before the `Math.floor(Math.random() * ...)` formula. Result always in `[scaledMin, scaledMax]` where both are <= 16.
  - **GenerateEncounterModal display** (`getSpawnRange()`): Same clamping applied. UI shows a valid range like "16-16" instead of an inverted "24-16".
  - **ModificationCard display** (`getEffectiveSpawnRange()`): Same clamping applied. Sub-habitat cards show valid ranges.
- **Status:** CORRECT
- **Notes:** All three code paths that apply density multipliers to spawn ranges are fixed with identical logic. The ticket's "Duplicate code path check" confirmed these are the only three affected paths. The three non-multiplier paths (`useTableEditor.ts`, `TableCard.vue`, `EncounterTableCard.vue`) display base ranges directly from `DENSITY_RANGES` and are unaffected.

## Issues Found

None. The fix is internally consistent and resolves the mathematical bug in all affected code paths.

## PTU Compliance Assessment

This fix operates entirely within app-defined homebrew territory. PTU 1.05 does not define:
- Density tiers or spawn count ranges
- Density multipliers
- Maximum encounter sizes (beyond the Swarm Template guidance for 12+ Pokemon)

The app's density system is a GM convenience tool for random encounter generation. The `MAX_SPAWN_COUNT` of 16 is a practical cap, not a PTU requirement. The clamping fix ensures the app's own rules are self-consistent -- the spawn count always respects the cap the app itself defines.

## Summary

- Mechanics checked: 3
- Correct: 3
- Incorrect: 0
- Needs review: 0

## Rulings

1. **Clamping scaledMin to scaledMax is the correct fix.** When a multiplier pushes the minimum above the cap, the only valid behavior is to collapse the range to [scaledMax, scaledMax]. Allowing the range to invert would produce spawn counts above MAX_SPAWN_COUNT, violating the app's own constraint.

2. **No PTU rules are affected.** The entire density/spawn-count system is homebrew. There are no PTU-mandated spawn counts to conflict with.

## Verdict

APPROVED -- The fix correctly resolves an arithmetic edge case where high density multipliers caused the random range formula to produce spawn counts exceeding the app's own MAX_SPAWN_COUNT cap. The clamping logic is applied consistently across all three code paths (server generation, encounter modal display, modification card display). No PTU rules are involved since the density tier system is entirely app-defined.
