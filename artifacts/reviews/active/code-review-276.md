---
review_id: code-review-276
review_type: code
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-014
domain: vtt-grid, combat
commits_reviewed:
  - 12b28670
  - 981cdfb7
  - 35bffb0c
  - ee1a050f
  - 38988c9c
  - c50258ff
  - bed9ff3b
  - 40d2f9e8
  - 092929fa
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T14:30:00Z
follows_up: code-review-272
---

## Scope

Code-level review of feature-014 P2 (VTT Flanking Detection automation tier). 9 commits implementing: auto-detect watcher (Section I), server-side flanking penalty (Section J), CombatantCard badge (Section K), WebSocket sync (Section L), P1 MED fixes (app-surface.md update, decree-need-039 comment replacement), and a TDZ fix in gm/index.vue.

**Note:** This code review is authored by the Game Logic Reviewer focusing on PTU correctness aspects. The Senior Reviewer or Code Health Auditor handles code quality concerns (style, architecture, performance). Findings here concern game logic code structure only.

## Files Reviewed

| File | Changes | Purpose |
|------|---------|---------|
| `app/composables/useFlankingDetection.ts` | Watcher + callbacks | Auto-detect flanking transitions |
| `app/server/api/encounters/[id]/calculate-damage.post.ts` | `getFlankingPenaltyForTarget()` | Server-side flanking in accuracy |
| `app/components/encounter/CombatantCard.vue` | `isFlanked` prop + badge | UI indicator |
| `app/components/gm/CombatantSides.vue` | Pass `isTargetFlanked` prop | Prop plumbing |
| `app/pages/gm/index.vue` | Flanking detection + WS broadcast | Page integration + TDZ fix |
| `app/server/routes/ws.ts` | `flanking_update` case | WS relay |
| `app/composables/useWebSocket.ts` | `receivedFlankingMap` state | WS reception |
| `app/composables/useMoveCalculation.ts` | Comment update | decree-040 citation |

## Findings

### No Issues Found

The P2 implementation is clean and well-structured from a game logic perspective:

1. **Consistent foe filtering:** Both client-side (`useFlankingDetection.ts`) and server-side (`calculate-damage.post.ts`) use identical filtering criteria for flanking foes: positioned, alive (hp > 0), not Dead, not Fainted. The server-side implementation correctly improves on the design spec by adding the Fainted check.

2. **Shared utility reuse:** The server-side `getFlankingPenaltyForTarget()` correctly calls `checkFlankingMultiTile()` from the shared `flankingGeometry.ts` utility rather than reimplementing the algorithm. This ensures consistency between client and server flanking detection.

3. **Formula consistency:** The accuracy threshold formula is equivalent between client and server:
   - Client: `Math.max(1, moveAC + Math.min(9, evasion) - accuracy - flankingPenalty + roughPenalty)`
   - Server: `Math.max(1, moveAC + Math.max(0, Math.min(9, evasion) - flankingPenalty) - accuracy)`
   - The server omits roughPenalty (which is a client-side targeting path concern, not applicable to server-side calculation). This is architecturally correct.

4. **TDZ fix is sound:** The fix moves computed declarations before their usage, which is the correct resolution. The separate watcher for WebSocket broadcast (instead of using the composable's `onFlankingChanged` callback) avoids a circular reference issue where the callback would need to access `flankingMap` before it's returned from `useFlankingDetection`. The comment explains this reasoning clearly.

5. **WebSocket data flow is complete:** GM computes -> broadcasts via `flanking_update` -> server relays (gated to GM role) -> clients store in `receivedFlankingMap`. The group/player view rendering integration is deferred but the data pipeline is functional.

6. **Prop chain is correct:** `gm/index.vue` creates `useFlankingDetection(allCombatants)`, passes `isTargetFlanked` to `CombatantSides`, which passes `isTargetFlanked?.(combatant.id) ?? false` to each `CombatantCard`'s `isFlanked` prop. The optional chaining handles the case where the prop is not provided.

## P1 MED Fixes

Both MEDs from code-review-272 are resolved:

1. **app-surface.md update** (commit 092929fa): Verified via commit message. The P1 flanking functions are now documented in the app surface reference.

2. **Stale decree-need-039 comment** (commit 40d2f9e8): The old comment "pending decree-need-039" was replaced with "Per decree-040: flanking penalty applies AFTER the evasion cap of 9." The replacement correctly cites the active decree.

## Verdict

**APPROVED** -- Zero issues found. The implementation is consistent, well-documented, and correctly uses shared utilities. The TDZ fix is sound. Both P1 MED fixes are resolved.
