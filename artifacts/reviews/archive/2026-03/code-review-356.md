---
review_id: code-review-356
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-063
domain: vtt-grid
commits_reviewed:
  - 302800df
  - 66da513b
  - b33bd8dd
files_reviewed:
  - app/utils/movementModifiers.ts
  - app/server/services/intercept.service.ts
  - app/tests/unit/composables/useGridMovement.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-06T11:00:00Z
follows_up: null
---

## Review Scope

Bug-063: Speed CS floor of 2 nullified the Slowed penalty when applied after Slowed halved the speed. Three commits across three files reorder the movement modifier application, deduplicate the intercept service's inline copy, and update tests.

**Decrees checked:** decree-023 (burst shapes), decree-024 (diagonal cones), decree-025 (rough terrain accuracy) -- none apply to movement modifier ordering. No decrees govern movement modifier application order; this fix is driven purely by PTU rulebook text (CS floor p.700 vs Slowed p.1718). No decree violations found.

## Verification

### 1. PTU Correctness of New Ordering

**Old order:** Stuck -> Tripped -> Slowed -> Speed CS (floor 2) -> Sprint -> final minimum.
**New order:** Stuck -> Tripped -> Speed CS (floor 2) -> Slowed (min 1) -> Thermosensitive -> Sprint -> final minimum.

The fix is PTU-correct:
- PTU 1.05 p.700: Speed CS negative "may never reduce [movement] below 2" -- this floor is specific to the CS penalty itself.
- PTU 1.05 p.1718: Slowed "Movement halved (minimum 1)" -- independent condition, not subject to the CS floor.

By applying CS first and then Slowed, the CS floor protects against CS-only reduction, but Slowed can then further halve the result below 2. This is the correct interpretation: the floor of 2 is a property of the CS mechanic, not a global movement floor.

**Traced the bug-063 scenario (base 4m, CS -4, Slowed):**
- Old: Slowed(4)=2, CS(2-2=0, floor 2)=2. Slowed had zero net effect. BUG.
- New: CS(4-2=2, floor 2)=2, Slowed(2/2)=1. Slowed correctly reduces to 1. FIXED.

### 2. Intercept Service Deduplication

The old `getCombatantSpeed` in `intercept.service.ts` was a 50-line inline copy of the movement modifier logic. It had two additional divergences beyond the bug:

1. **Human trainer speed:** Hardcoded `baseSpeed = 5` instead of computing from Athletics/Acrobatics via `getOverlandSpeed()`. The new code correctly delegates to `getOverlandSpeed()`, which computes the PTU-accurate value. This is a net improvement.

2. **Thermosensitive:** The old code omitted Thermosensitive Hail halving. The new code calls `applyMovementModifiers(combatant, baseSpeed)` without a `weather` parameter, so `weather` defaults to `undefined`, and the Thermosensitive check (`weather === 'hail'`) is skipped. Behavior is unchanged for Thermosensitive -- the intercept service does not have encounter weather context in its current call sites. If weather awareness is needed later, callers can pass it.

3. **`||` vs `??` for Pokemon overland:** Old code used `pokemon.capabilities?.overland || 5` (falsy fallback, treating 0 as 5). New code via `getOverlandSpeed` uses `?? 5` (nullish fallback, preserving 0). This is more correct -- a Pokemon with Overland 0 should genuinely have speed 0, not be treated as 5. Edge case improvement, not a regression.

The deduplication is clean. The two new imports (`getOverlandSpeed`, `applyMovementModifiers`) are correct, and `getCombatantSpeed` is now a two-line wrapper. No other callers in the codebase still inline movement modifier logic.

### 3. Test Coverage

**Updated tests (4):** All interaction tests updated to reflect CS-before-Slowed ordering with correct expected values:
- Slowed + CS positive: was 5, now 4 (CS+3=8, halve=4)
- Slowed + CS negative: was 2, now 1 (CS-3=2, halve=1)
- Slowed + CS + Sprint: was 9, now 7 (CS+2=10, halve=5, sprint=7)
- Test descriptions updated to explain the new ordering

**New regression tests (2):**
- "Slowed on base 4m: should halve to 2" -- the exact bug-063 scenario without CS
- "Slowed + negative CS on base 4m: Slowed should still reduce below CS floor" -- the exact bug-063 scenario with CS

All 48 tests pass.

### 4. Edge Cases Verified

| Scenario | Result | Correct? |
|---|---|---|
| Speed 0 (immobile) | 0 | Yes -- base 0 returns 0, no floor applies |
| Negative CS beyond -6 | Clamped to -6, floor 2 applies | Yes |
| Slowed on speed 1 | floor(1/2)=0, final min raises to 1 | Yes -- matches PTU "minimum 1" |
| Stuck overrides everything | Returns 0 immediately | Yes |
| Tripped overrides everything | Returns 0 immediately | Yes |
| Sprint after Slowed | Halve then +50% | Yes -- Sprint is last modifier |

### 5. Commit Granularity

Three commits, each single-purpose:
1. `302800df` fix: reorder in `movementModifiers.ts` (1 file)
2. `66da513b` refactor: deduplicate in `intercept.service.ts` (1 file)
3. `b33bd8dd` test: update + add regression tests (1 file)

Correct ordering -- the fix commit produces a working state, then the refactor, then tests. All commits are appropriately scoped.

## What Looks Good

1. **Root cause correctly identified and fixed.** The CS floor of 2 is a CS-specific property, not a global floor. Moving CS before Slowed is the correct interpretation of PTU rules.

2. **Deduplication is a strong improvement.** The intercept service's inline copy was already drifting (same bug, plus hardcoded trainer speed). Replacing it with the canonical utility prevents future divergence. The pattern matches how `mounting.service.ts`, `living-weapon-movement.service.ts`, and `turn-helpers.ts` already consume `applyMovementModifiers`.

3. **Regression tests target the exact reported bug.** Both the base-4m-Slowed case and the base-4m-negative-CS-Slowed case are now covered, directly preventing reintroduction.

4. **Clear documentation in code comments.** The header comment in `movementModifiers.ts` now explicitly lists the application order with PTU page references and explains WHY CS is applied before Slowed.

## Verdict

**APPROVED.** The fix is PTU-correct, the deduplication is clean with no unintended behavior changes, test coverage is adequate with targeted regression tests, and commit granularity is appropriate. No issues found.

## Required Changes

None.
