---
review_id: code-review-208
review_type: code+rules
reviewer: senior-reviewer
trigger: bug-fix+refactoring
target_report: ptu-rule-094+refactoring-089+refactoring-090
domain: healing
commits_reviewed:
  - ac5b40b
  - 87f9f64
  - ee00288
files_reviewed:
  - app/utils/restHealing.ts
  - app/tests/unit/utils/restHealing.test.ts
  - app/server/services/rest-healing.service.ts
  - app/tests/unit/services/restHealing.service.test.ts
  - .claude/skills/references/app-surface.md
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/server/api/characters/[id]/rest.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-27T16:30:00Z
follows_up: none (first review)
---

## Review Scope

Three P4 healing-domain changes from session 54 plan (plan-20260227-153711):

1. **ptu-rule-094** (commit ac5b40b): Removed `Math.max(1, ...)` from natural healing formula in `calculateRestHealing()` and `getRestHealingInfo()`. PTU specifies `floor(maxHp / 16)` with no minimum.
2. **refactoring-090** (commit 87f9f64): Extended `refreshDailyMoves()` to clear stale `usedToday` values on non-daily moves (At-Will, EOT, Scene) during extended rest for data hygiene.
3. **refactoring-089** (commit ee00288): Added `rest-healing.service.ts` to `app-surface.md` manifest.

**Decree compliance checked:** Decrees 016-020 (rest/healing domain). All applicable decrees respected:
- decree-017 (injury cap on healing): `calculateRestHealing()` still caps healing at effective max HP via `getEffectiveMaxHp()`. Confirmed correct.
- decree-018 (extended rest duration): Extended rest endpoint continues to accept duration parameter. Not modified by these commits.
- decree-019 (New Day independence): Not affected by these commits.
- decree-016, decree-020: Not affected by these commits.

## Code Review (code-review-208)

### ptu-rule-094 (ac5b40b) — Natural Healing Formula

**Formula correctness:** The change from `Math.max(1, Math.floor(maxHp / 16))` to `Math.floor(maxHp / 16)` is correct per PTU Core p.252 (labeled p.250 in code comments — the rule text appears at line 1996-1997 of `07-combat.md`): "heal 1/16th of their Maximum Hit Points." No minimum is specified in the rulebook. Floor rounding is the standard PTU approach for fractional results.

**Both call sites updated:** `calculateRestHealing()` (line 66) and `getRestHealingInfo()` (line 175) both had `Math.max(1, ...)` removed. Grep confirms no remaining instances of the old pattern in the codebase.

**Test updated:** Test case correctly changed from expecting 1 to expecting 0 for a 10 maxHp entity (`floor(10/16) = 0`). Test description updated to reference PTU floor rounding semantics.

**Downstream behavior verified:** When `calculateRestHealing()` returns `{ canHeal: true, hpHealed: 0 }` for a low-HP entity:
- **30-min rest endpoint** (`rest.post.ts`): Will apply 0 HP healing, increment rest minutes by 30, respond with "Healed 0 HP." This is technically correct — the entity IS resting, just gaining nothing. The rest time consumption is accurate.
- **Extended rest endpoint** (`extended-rest.post.ts`): Loop continues for all periods, consuming rest time but healing 0 each period. This is correct — low-HP entities should still be able to rest (for extended rest benefits like status clearing, AP restoration, move refresh) even if HP healing is 0.

**Immutability:** No mutation introduced. Both functions are pure calculations returning new objects.

**File size:** `restHealing.ts` at 245 lines — well within limits.

### refactoring-090 (87f9f64) — Non-Daily Move usedToday Clearing

**Logic correctness:** The new branch at lines 61-68 of `rest-healing.service.ts` correctly identifies non-daily moves with stale `usedToday > 0` and resets them to 0 using spread operator (immutable). The `cleanedNonDaily` counter properly triggers DB write-back at line 107 (`restoredMoves.length > 0 || cleanedNonDaily > 0`).

**PTU rules compliance:** PTU Core p.252 explicitly states "Daily-Frequency Moves are also regained during an Extended Rest." The rules are silent on non-daily move tracking during rest. Clearing `usedToday` on non-daily moves is purely a data hygiene measure — `usedToday` has no gameplay enforcement for At-Will/EOT/Scene frequencies (those use `lastTurnUsed`, `usedThisScene` per the Move type definition). This is correctly documented in the code comments.

**Immutability:** Spread operator used at line 63 (`{ ...move, usedToday: 0 }`). No input mutation. Existing immutability test at line 169 covers daily moves. The non-daily path uses the same spread pattern and is safe, though a dedicated immutability test for the non-daily path would be a nice-to-have (not blocking).

**Test coverage:** New test case `'clears stale usedToday on non-daily moves for data hygiene'` (line 113) covers three non-daily frequencies (At-Will, EOT, Scene) with non-zero `usedToday`. Existing test `'does not touch At-Will, EOT, or Scene moves with usedToday 0'` (line 97) was updated to also assert `cleanedNonDaily: 0`, confirming the new counter works correctly for the no-op case.

**Return type updated:** `cleanedNonDaily` added to the return signature at line 35. Caller in `refreshDailyMovesForOwnedPokemon()` destructures it at line 102 and uses it in the write-back condition at line 107. Clean integration.

**Reporting:** Note that `cleanedNonDaily` only affects DB write-back, NOT the results array (line 117). This is correct — non-daily cleaning is invisible to the API response, which only reports daily move refresh/skip results. No noise in the user-facing output.

**File size:** `rest-healing.service.ts` at 130 lines — well within limits.

### refactoring-089 (ee00288) — app-surface.md Manifest Update

**Entry correctness:** Row added at line 229: `server/services/rest-healing.service.ts | Extended rest move refresh — refreshDailyMoves, refreshDailyMovesForOwnedPokemon`. Both exported functions are listed. Description is accurate. Placement is alphabetically sensible (after pokemon-generator, before csv-import).

### Commit Granularity

Three commits for three distinct changes: a rule correctness fix, a refactoring, and a docs update. Each commit touches only the files relevant to its concern. Commit messages follow conventional format with clear descriptions. Commit bodies include rule references. Correct granularity.

## Issues

No CRITICAL, HIGH, or MEDIUM issues found.

## What Looks Good

1. **Surgical formula fix:** Only the `Math.max(1, ...)` wrapper was removed, preserving the `Math.floor()` and the rest of the healing pipeline. No collateral changes.
2. **Both call sites caught:** Both `calculateRestHealing()` and `getRestHealingInfo()` were updated consistently. Grep confirms no remaining instances of the old pattern.
3. **Non-daily move cleaning is well-scoped:** The data hygiene change only touches `usedToday` for non-daily moves. It does not interfere with `lastTurnUsed`, `usedThisScene`, or any other frequency-enforcement fields. The `cleanedNonDaily` counter avoids unnecessary DB writes when nothing changed.
4. **Immutability maintained throughout:** All new code paths use spread operators to create new objects. No mutation.
5. **Test coverage is solid:** Updated test expectations for the formula change, new test cases for the non-daily cleaning, and the existing test suite continues to validate the rolling-window daily move logic.
6. **PTU rule citations in comments:** Both the formula change and the move refresh change cite specific PTU page numbers and quote the relevant rules.
7. **Decree compliance:** All applicable rest-domain decrees (016-020) are respected. No violations.

## Verdict

**APPROVED** — All three changes are correct, well-tested, properly scoped, and follow project patterns. The PTU natural healing formula now correctly implements `floor(maxHp / 16)` with no minimum per the rulebook. The non-daily move cleaning is a sensible hygiene improvement with no gameplay impact. The app-surface manifest is updated.
