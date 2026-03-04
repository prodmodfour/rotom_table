---
review_id: code-review-315
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-131
domain: capture
commits_reviewed:
  - 784004b5
  - 67718020
  - 557b3164
  - c9a8e3b4
  - f620d391
  - cba0dd2d
  - 8e5d7212
files_reviewed:
  - app/composables/useCapture.ts
  - app/components/capture/CapturePanel.vue
  - app/components/encounter/CombatantCaptureSection.vue
  - app/composables/usePlayerRequestHandlers.ts
  - app/server/api/capture/attempt.post.ts
  - app/components/player/PlayerCapturePanel.vue
  - app/tests/unit/api/captureAttempt.test.ts
  - app/utils/damageCalculation.ts
  - app/composables/useMoveCalculation.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-131.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T09:15:00Z
follows_up: code-review-312
---

## Review Scope

Re-review of fix cycle for code-review-312 (1C, 1H, 2M) and rules-review-285 (1H, 1M). The fix cycle consists of 5 commits by slave-1 (c9a8e3b4, f620d391, cba0dd2d, 8e5d7212, plus the original implementation commits). Reviewing the final state of all files against every previous finding.

Decree compliance checked: decree-042 (full accuracy system for Poke Ball throws), decree-040 (flanking after evasion cap), decree-025 (exclude endpoints from rough terrain check).

## Previous Issue Resolution

### C1 / HIGH-1 (code-review-312, rules-review-285): Double Math.max(1,...) clamping — RESOLVED

The original code called `calculateAccuracyThreshold(6, accuracyStage, speedEvasion)` which clamps to `Math.max(1, ...)` internally, then applied flanking/rough terrain and clamped again with a second `Math.max(1, ...)`. This produced incorrect thresholds when `(AC + evasion - accuracy) < 1` and `roughTerrainPenalty > 0`.

**Fix verified (commit c9a8e3b4):** The two-step calculation was replaced with a single-expression formula:

```typescript
const effectiveEvasion = Math.min(9, speedEvasion)
const threshold = Math.max(1, 6 + effectiveEvasion - accuracyStage - flankingPenalty + roughTerrainPenalty)
```

This structurally matches `useMoveCalculation.ts` line 443:
```typescript
return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)
```

Both formulas: (1) cap evasion at 9, (2) combine all modifiers in one expression, (3) apply `Math.max(1, ...)` exactly once as the final step. Per decree-042, Poke Ball throws and move accuracy checks now produce identical thresholds under the same conditions.

The unused `calculateAccuracyThreshold` import was removed and replaced with a clarifying comment explaining why the inline formula is used.

**Concrete scenario re-verified:** AC=6, accuracyStage=8, speedEvasion=0, roughTerrainPenalty=2, flankingPenalty=0.
- Capture: `Math.max(1, 6 + 0 - 8 - 0 + 2) = Math.max(1, 0) = 1`. Correct.
- Move: `Math.max(1, 6 + 0 - 8 - 0 + 2) = Math.max(1, 0) = 1`. Identical.

### H1 (code-review-312): Misleading comment claiming useMoveCalculation uses calculateAccuracyThreshold — RESOLVED

**Fix verified (commit f620d391):** `app-surface.md` updated to say "Computes the threshold inline as a single expression -- matching the formula in useMoveCalculation.ts -- to avoid double clamping" instead of the false claim that `useMoveCalculation.ts` uses `calculateAccuracyThreshold`. The `useCapture.ts` comment (commit c9a8e3b4) also correctly states "Threshold is computed inline as a single expression -- matching the formula in useMoveCalculation.ts:416."

Confirmed by reading `useMoveCalculation.ts`: it does NOT import `calculateAccuracyThreshold`. The accuracy threshold is computed inline at line 443.

### M1 (code-review-312): Server trust rationale comment — RESOLVED

**Fix verified (commit cba0dd2d):** A five-line comment was added at `attempt.post.ts` lines 53-57 explaining: "The server trusts the client-provided threshold because this is a single-user GM tool (no adversarial clients), and full server-side recomputation would require encounter context (combatant positions, terrain grid, flanking geometry) that is not available in this endpoint." Clear and accurate.

### M2 (code-review-312): Ticket resolution log commit hashes — RESOLVED

**Fix verified:** `ptu-rule-131.md` Resolution Log now lists all 10 correct commit hashes (784004b5, 67718020, 656a2042, 23ae58af, 557b3164, 430857a3, c9a8e3b4, f620d391, cba0dd2d, 8e5d7212) matching the actual commits on the branch.

### MED-1 (rules-review-285): CaptureAccuracyParams.targetSpeedEvasion documentation — RESOLVED

**Fix verified (commit 8e5d7212):** The doc comment was updated from `"(0-6+)"` to `"Target Pokemon's total Speed Evasion (stat-derived + bonus evasion). Capped at 9 inside rollAccuracyCheck per PTU p.234. Default 0."` This accurately describes the expected input range and where the cap is enforced.

## Decree Compliance

**decree-042 (full accuracy system for Poke Ball throws):** Fully compliant. The capture accuracy check uses the same formula structure as the move accuracy system: `Math.max(1, AC + Math.min(9, evasion) - accuracyStage - flankingPenalty + roughTerrainPenalty)`. Both paths (GM CapturePanel via CombatantCaptureSection, and player request via usePlayerRequestHandlers) correctly supply thrower accuracy stages and target Speed Evasion from encounter combatant data. Natural 1/20 handling is correct.

**decree-040 (flanking after evasion cap):** Compliant. Evasion is capped at 9 via `Math.min(9, speedEvasion)` before flanking penalty is subtracted in the combined expression. The formula `6 + Math.min(9, speedEvasion) - accuracyStage - flankingPenalty + roughTerrainPenalty` applies flanking after the cap, matching the move system.

**decree-025 (exclude endpoints from rough terrain):** Not directly applicable in this code — rough terrain penalty defaults to 0 because VTT grid context is not available in the capture UI. The parameter is correctly wired through for future VTT integration. The comment in `CombatantCaptureSection.vue` lines 139-141 documents this.

## What Looks Good

1. **Formula parity with move system.** The capture threshold formula is now structurally identical to `useMoveCalculation.ts:443`. Single `Math.max(1, ...)` clamp, evasion capped at 9, all modifiers combined in one expression. The double-clamping bug is definitively eliminated.

2. **Clean comment hygiene.** All three comment/documentation fixes (inline code comment in useCapture.ts, app-surface.md description, server trust rationale) are accurate and do not overstate or understate the relationship between the capture and move accuracy systems.

3. **Well-structured commit granularity.** Five fix-cycle commits, each addressing one specific finding: double-clamping (c9a8e3b4), misleading comment (f620d391), server trust rationale (cba0dd2d), targetSpeedEvasion docs (8e5d7212). The original implementation commits (784004b5 through 430857a3) were not re-squashed, preserving clean history.

4. **Resolution log is now comprehensive.** All 10 commits (original + fix cycle) are documented with correct hashes, descriptions, and affected files.

5. **Test coverage for decree-042.** Two test cases cover the critical threshold behavior: "roll passes default but fails custom threshold" and "roll meets custom threshold." The nat-1/nat-20 tests cover edge cases.

6. **Dual-path consistency.** Both capture paths correctly compute accuracy params from encounter combatant data before calling `rollAccuracyCheck`. The `usePlayerRequestHandlers.ts` path mirrors `CombatantCaptureSection.vue` in reading trainer accuracy stages and target Speed Evasion.

## Verdict

**APPROVED**

All four findings from code-review-312 (C1, H1, M1, M2) and both findings from rules-review-285 (HIGH-1, MED-1) have been addressed correctly. The double-clamping bug is fixed, comments are accurate, documentation is updated, and the implementation is now fully consistent with the move accuracy system per decree-042. No new issues introduced by the fix cycle.
