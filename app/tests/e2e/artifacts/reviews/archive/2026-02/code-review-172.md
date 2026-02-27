---
review_id: code-review-172
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ux-004
domain: player-view
commits_reviewed:
  - 5caa12f
  - a56e48b
  - 52e7358
files_reviewed:
  - app/utils/displayHp.ts
  - app/composables/usePlayerGridView.ts
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/VTTToken.vue
  - app/tests/e2e/artifacts/tickets/ux/ux-004.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-26T07:20:00Z
follows_up: code-review-167
---

## Review Scope

Re-review of ux-004 fix cycle, which addressed code-review-167 findings:
- **H1 HIGH:** Duplicated `roundToDisplayTier` function in `usePlayerGridView.ts` and `GridCanvas.vue` -- DRY violation with drift risk.
- **M1 MEDIUM:** Dead `getDisplayHp` function in composable -- exported but never consumed by any component.
- **M2 MEDIUM:** Ticket resolution log references wrong commit hashes.

## Issues

No issues found.

## Verification of Previous Issues

### H1 HIGH (RESOLVED): Duplicated roundToDisplayTier -- DRY violation

**Verified.** Commit `5caa12f` creates `app/utils/displayHp.ts` (22 lines) containing the single canonical `roundToDisplayTier` function (exported, lines 14-22). The same commit modifies `GridCanvas.vue` to import from the shared utility (line 76: `import { roundToDisplayTier } from '~/utils/displayHp'`) and removes the local duplicate (net -13 lines from GridCanvas).

Grep confirms exactly one definition of `roundToDisplayTier` across the entire `app/` source tree:
- `app/utils/displayHp.ts:14` -- the definition (exported)
- `app/components/vtt/GridCanvas.vue:76` -- import statement
- `app/components/vtt/GridCanvas.vue:170` -- comment referencing the import
- `app/components/vtt/GridCanvas.vue:192` -- call site

No remaining definition in `usePlayerGridView.ts`. Single source of truth achieved. The tier thresholds (>=88 -> 100, >=63 -> 75, >=38 -> 50, >=25 -> 25, >0 -> 10, <=0 -> 0) are documented in the JSDoc of the shared utility and match the original implementation exactly.

### M1 MEDIUM (RESOLVED): Dead getDisplayHp in composable

**Verified.** Commit `a56e48b` removes 33 lines from `usePlayerGridView.ts`. Grep confirms zero occurrences of `getDisplayHp` in any source file under `app/composables/` or `app/components/`. The function and its local `roundToDisplayTier` dependency are both gone.

The composable's return object no longer exports `getDisplayHp`. The remaining return values are: `isOwnCombatant`, `ownCombatants`, `visibleTokens`, `getInfoLevel`, `selectedCombatantId`, `selectToken`, `clearSelection`, `moveConfirmTarget`, `pendingMove`, `setMoveTarget`, `confirmMove`, `cancelMoveConfirm`, `primaryTokenPosition`. All of these are consumed by `PlayerEncounterView.vue` or `PlayerGridView.vue`.

The actual HP masking responsibility is correctly owned by `GridCanvas.vue` via `getDisplayHpOverride()` (lines 177-193), which computes rounded HP for enemy combatants in player mode and passes it to VTTToken via the `:display-hp-override` prop. This is the right architectural choice: the component that renders VTTToken tokens owns the display logic for those tokens.

### M2 MEDIUM (RESOLVED): Wrong commit hashes in ticket

**Verified.** Commit `52e7358` updates `app/tests/e2e/artifacts/tickets/ux/ux-004.md` resolution log. The commit hashes now reference:
- `e3facc8` -- confirmed exists: "feat: add 25% increment rounding to getDisplayHp for enemy combatants"
- `dabee52` -- confirmed exists: "feat: add displayHpOverride prop to VTTToken for HP masking"
- `a9fb82b` -- confirmed exists: "feat: wire enemy HP masking from GridCanvas to VTTToken in player mode"

All three hashes were verified via `git log --oneline --all | grep`. The previously incorrect hashes (aa0a8fe, 9363563, 4d90081) have been replaced. The ticket also adds entries for the fix cycle commits (ddcd8d9 for H1, ad2734e for M1) and updates the "Files Changed" section to reflect the shared utility extraction.

## What Looks Good

1. **Clean extraction pattern.** `displayHp.ts` is a focused 22-line utility with a single exported function, thorough JSDoc documenting the tier thresholds, and no dependencies. This is the correct granularity for a shared utility per project conventions.

2. **No behavioral change.** The tier thresholds in `displayHp.ts` are byte-for-byte identical to the originals. GridCanvas calls `roundToDisplayTier(rawPercent)` at line 192 exactly as before. VTTToken's `hpPercent` computed (lines 159-169) uses `displayHpOverride` when provided. The rendering pipeline is unchanged.

3. **No regression on Group View.** `GroupGridCanvas.vue` does not pass `playerMode` to GridCanvas, so `getDisplayHpOverride()` returns `undefined` for all tokens. Group View continues showing exact HP bars. Verified by reading GridCanvas line 178 (`if (!props.playerMode) return undefined`).

4. **Dead code fully removed.** Both `getDisplayHp` and its local `roundToDisplayTier` were removed from usePlayerGridView. No orphaned imports or references remain.

5. **Commit granularity is correct.** Three commits: extraction (H1), dead code removal (M1), docs fix (M2). Each addresses exactly one review finding and is independently coherent.

6. **Ticket resolution log is now complete and accurate.** The table format clearly maps dates, commits, and descriptions. File changed summary is up to date. Verification notes confirm no Group View regression and explain the isometric mode non-impact.

## Verdict

**APPROVED** -- All three issues from code-review-167 have been addressed correctly. The `roundToDisplayTier` function has a single source of truth in `app/utils/displayHp.ts`. Dead code is removed. Ticket documentation is accurate. No new issues introduced.
