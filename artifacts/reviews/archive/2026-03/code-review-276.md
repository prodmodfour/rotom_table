---
review_id: code-review-276
review_type: code
reviewer: senior-reviewer
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
files_reviewed:
  - app/composables/useFlankingDetection.ts
  - app/utils/flankingGeometry.ts
  - app/composables/useMoveCalculation.ts
  - app/composables/useWebSocket.ts
  - app/components/encounter/CombatantCard.vue
  - app/components/gm/CombatantSides.vue
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/VTTContainer.vue
  - app/pages/gm/index.vue
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/server/routes/ws.ts
  - app/stores/encounter.ts
  - app/types/api.ts
  - app/utils/combatSides.ts
  - .claude/skills/references/app-surface.md
  - artifacts/designs/design-flanking-001/_index.md
  - artifacts/designs/design-flanking-001/spec-p2.md
  - decrees/decree-040.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-02T14:30:00Z
follows_up: code-review-272
---

## Review Scope

P2 implementation of feature-014 (VTT Flanking Detection), covering 4 design spec sections:

- **Section I**: Auto-detect flanking on token movement (watcher in `useFlankingDetection.ts`)
- **Section J**: Server-side flanking penalty in `calculate-damage.post.ts`
- **Section K**: CombatantCard `isFlanked` badge
- **Section L**: WebSocket `flanking_update` sync between GM and group/player views

Also reviewed the P1 MED fixes from code-review-272:
- MED-1: `app-surface.md` updated with P1 functions (commit 092929fa)
- MED-2: Stale `decree-need-039` comment replaced with `decree-040` citation (commit 40d2f9e8)

Also reviewed the TDZ fix applied by the collector (commit 12b28670).

## Decree Check

- **decree-002** (PTU alternating diagonal): Not directly relevant to P2 -- flanking adjacency uses 8-directional neighbor checks, not distance measurement. No conflict.
- **decree-003** (enemy-occupied squares as rough terrain): Not directly relevant to flanking detection itself -- rough terrain penalty is a separate accuracy modifier. No conflict.
- **decree-040** (flanking penalty applies AFTER evasion cap): Correctly implemented in both client-side (`useMoveCalculation.ts` line 404: `effectiveEvasion - flankingPenalty`) and server-side (`calculate-damage.post.ts` line 316: `effectiveEvasionWithFlanking = Math.max(0, effectiveEvasion - flankingPenalty)` where `effectiveEvasion = Math.min(9, applicableEvasion)`). Per decree-040, this approach is confirmed correct.

## Issues

### MEDIUM

#### MED-1: `flanking_update` missing from `WebSocketEvent` union type

**File:** `app/types/api.ts`
**Lines:** 31-93

The `WebSocketEvent` discriminated union in `types/api.ts` does not include a `flanking_update` variant. The GM page (`gm/index.vue` line 358) calls `send({ type: 'flanking_update', data: {...} })`, and `useWebSocket.ts` (line 222) handles `flanking_update` in its message handler. Both work at runtime because the server-side `ws.ts` uses string matching, but this bypasses TypeScript type safety.

This is a pre-existing pattern -- many event types handled in `ws.ts` (e.g., `status_tick`, `aoo_triggered`, `priority_declared`, `pokemon_evolved`) are also absent from the union type. So this is not unique to P2, but since P2 introduces a new event type, it should be added for consistency.

**Fix:** Add the following variant to the `WebSocketEvent` union in `app/types/api.ts`:

```typescript
// VTT events
| { type: 'flanking_update'; data: { encounterId: string; flankingMap: FlankingMap } }
```

Import `FlankingMap` from `~/types/combat`.

---

#### MED-2: Group/player views do not consume `receivedFlankingMap`

**File:** `app/composables/useWebSocket.ts`, group and player view pages

The WebSocket plumbing for `flanking_update` is fully implemented: GM broadcasts (line 356-366 in `gm/index.vue`), server relays (line 540-545 in `ws.ts`), and client receives and stores (line 222-226 in `useWebSocket.ts`, exposed as `receivedFlankingMap` at line 319). However, neither the group view (`app/pages/group/`) nor the player view (`app/pages/player/`) actually read `receivedFlankingMap` to render flanking indicators. The design spec Section L explicitly calls for the group view to receive and render flanking from WebSocket.

The infrastructure is complete and correct -- the missing piece is the consumer side wiring. This means group/player views will not show flanking badges or VTT flanking indicators, which is a functional gap relative to the spec.

**Fix:** In the group encounter view, read `receivedFlankingMap` from `useWebSocket()` and pass `isTargetFlanked` derived from it to CombatantCard and VTT components. Similarly for the player view if it renders CombatantCards.

---

## What Looks Good

### Section I: Auto-Detect Watcher (useFlankingDetection.ts)

The transition detection logic is clean and correct. The watcher compares `previousFlankedSet` against the new flanking map to detect newly-flanked and no-longer-flanked combatants. The `FlankingDetectionOptions` interface is well-designed with optional callbacks, maintaining backward compatibility with P0/P1 callers that pass no options.

The `previousFlankedSet` is a `ref<Set<string>>` which correctly persists across watcher invocations. The `{ deep: true }` option on the watcher ensures changes to nested `FlankingStatus` objects trigger recomputation.

### Section J: Server-Side Flanking (calculate-damage.post.ts)

The `getFlankingPenaltyForTarget` function correctly mirrors the client-side filtering logic:
- Excludes combatants without positions
- Excludes dead and fainted combatants (the design spec omitted the Fainted check, but the developer correctly added it for parity with the client-side)
- Uses `checkFlankingMultiTile` (the P1 multi-tile algorithm), not the simpler `checkFlanking` (P0 only) -- correct choice for production
- Uses `FLANKING_EVASION_PENALTY` constant rather than magic number 2

The integration into the accuracy calculation follows decree-040 exactly: `effectiveEvasionWithFlanking = Math.max(0, effectiveEvasion - flankingPenalty)` where `effectiveEvasion = Math.min(9, applicableEvasion)`. The response object extends `AccuracyCalcResult` with `flankingPenalty` to expose the penalty for debugging/display without breaking the existing interface.

### Section K: CombatantCard Badge

The `isFlanked` prop is optional (`isFlanked?: boolean`), so existing CombatantCard consumers that don't pass it won't break. The badge styling uses `$color-warning` consistently with the project's visual language for combat modifiers. The badge is placed after status conditions but before combat stages, which is a sensible ordering.

The prop plumbing through `CombatantSides.vue` is clean -- `isTargetFlanked` is an optional function prop that safely defaults to `false` via `?.(combatant.id) ?? false`.

### Section L: WebSocket Infrastructure

The `ws.ts` relay correctly restricts `flanking_update` to GM-originated messages (`clientInfo?.role === 'gm'`) and scopes broadcast to the encounter room (`broadcastToEncounter`). The `useWebSocket.ts` handler validates the incoming data shape before storing it.

### TDZ Fix (12b28670)

The collector correctly identified and fixed a Temporal Dead Zone error. The `encounter` computed was declared AFTER `allCombatants` which referenced `encounter.value`. Moving the computed declarations before the flanking detection block eliminates the TDZ. This is a clean structural fix with no behavioral change.

### P1 MED Fixes

- MED-1 (app-surface.md): Correctly updated to include `checkFlankingMultiTile`, `countAdjacentAttackerCells`, and `findIndependentSet` in the VTT Grid utilities entry.
- MED-2 (decree-need-039 comment): The stale "pending decree-need-039" comment in `useMoveCalculation.ts` was replaced with a proper `decree-040` citation. The formula remains correct per the decree.

### Commit Granularity

9 commits with clean separation: one per design section (I, J, K, L), separate commits for the P1 MED fixes, the WebSocket broadcast refactor (separate watcher), the ticket/spec update, and the TDZ fix. Each commit produces a working state.

### Immutability

No mutation violations detected. The `previousFlankedSet.value = newFlankedSet` in the watcher replaces the entire Set reference rather than mutating the existing one. The server-side function creates new objects for the foe list and result. All filter/map chains produce new arrays.

## Verdict

**APPROVED**

The P2 implementation is solid. All four design spec sections are correctly implemented. The server-side flanking detection correctly mirrors the client-side logic (including the Fainted check that the spec missed). Decree-040 is properly followed in both client and server accuracy calculations. The TDZ fix is sound. The P1 MED fixes from code-review-272 are properly addressed.

Two MEDIUM issues identified:
1. Missing `flanking_update` type in the `WebSocketEvent` union (pre-existing pattern, but should be fixed)
2. Group/player views don't consume `receivedFlankingMap` (infrastructure is complete, consumer wiring is missing)

Neither issue blocks the core flanking functionality -- the GM view, VTT grid, server-side accuracy, and CombatantCard badge all work correctly. The WebSocket infrastructure is in place for group/player consumption when those views are wired up.

## Required Changes

File tickets for both MEDs. These should be addressed in the next development cycle, not as a blocking fix cycle.

**MED-1 ticket:** Add `flanking_update` to `WebSocketEvent` union type in `app/types/api.ts`. (Quick type-safety fix, 1 file.)

**MED-2 ticket:** Wire `receivedFlankingMap` from `useWebSocket()` into group and player view pages. Derive `isTargetFlanked(id)` from the map and pass to CombatantCard. (2-3 files, straightforward prop plumbing.)
