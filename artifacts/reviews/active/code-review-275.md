---
review_id: code-review-275
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-combat
commits_reviewed:
  - be612172
  - f5bb1141
  - 6a7a455f
  - 4c8d1d5a
  - 181f7d09
  - eca48c9b
  - 96dea1f2
  - b3427228
  - 3667c128
  - fe5cce7c
  - 20cdfc51
files_reviewed:
  - app/composables/usePlayerCombat.ts
  - app/composables/usePlayerRequestHandlers.ts
  - app/composables/useSwitchModalState.ts
  - app/components/encounter/PlayerRequestPanel.vue
  - app/pages/gm/index.vue
  - app/types/player-sync.ts
  - app/server/routes/ws.ts
  - app/constants/pokeBalls.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/bug/bug-043.md
  - artifacts/tickets/open/bug/bug-044.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T22:30:00Z
follows_up: code-review-270
---

## Review Scope

Re-review of feature-023 P0 (Player Capture & Healing Interfaces) after fix cycle. 11 commits (be612172..20cdfc51) addressing all issues raised in code-review-270 (CR-1, HI-1..3, ME-1..4) and rules-review-246 (CRIT-001, HIGH-001, MED-001, MED-002). Each issue is verified below against the actual source files.

**Decrees checked:** decree-013 (1d100 capture), decree-014 (stuck/slow separate), decree-015 (real max HP), decree-017 (PC heals to effective max), decree-029 (rest healing min 1 HP). No decree violations. The player capture path continues to delegate to the existing `useCapture.attemptCapture()` which calls `/api/capture/attempt` using the 1d100 system per decree-013. Ball type now correctly passes through (see HIGH-001 verification below).

## Issue Resolution Verification

### From code-review-270

#### CR-1: gm/index.vue >800 lines -- RESOLVED

**Commit:** 6a7a455f (refactor: extract switch modal logic from gm/index.vue into composable)

The switch modal state, computed props, and handlers were extracted into `app/composables/useSwitchModalState.ts` (136 lines). The new composable encapsulates:
- `showSwitchModal`, `switchModalMode` refs
- `handleSwitchPokemon`, `handleFaintedSwitch`, `handleForceSwitch` handlers (all with undo snapshots)
- `handleSwitchCompleted` handler (with WebSocket broadcast)
- `switchModalTrainerId`, `switchModalPokemonId`, `switchModalTrainerEntityId` computed props

**Verified:** `gm/index.vue` is now 770 lines (including template, script, and style blocks), well under the 800-line cap. The composable correctly receives `encounter`, `send`, and `refreshUndoRedoState` via its options interface, matching the dependency pattern used by `usePlayerRequestHandlers` and `useEncounterActions`.

The extraction is clean: the composable handles all three switch flows (standard, fainted, forced) and the computed props that resolve trainer/pokemon combatant IDs from the clicked combatant. The parent page destructures the return values at line 409-423 and passes them to template bindings unchanged.

#### HI-1: Unused encounterId prop -- RESOLVED

**Commit:** 4c8d1d5a (fix: remove unused encounterId prop from PlayerRequestPanel)

**Verified:** `PlayerRequestPanel.vue` no longer accepts any props (no `defineProps` call). A comment at line 122 explains: "No props needed -- WebSocket server already scopes player_action forwarding to the encounter room, so no client-side filtering required." This is correct: `ws.ts` line 374 checks `clientInfo.encounterId` before forwarding `player_action` messages, so the component only receives messages for the current encounter.

The parent `gm/index.vue` line 58-65 no longer passes `:encounter-id`.

#### HI-2: Missing undo snapshots -- RESOLVED

**Commit:** 181f7d09 (fix: add undo snapshots before capture, breather, and healing approval)

**Verified in `usePlayerRequestHandlers.ts`:**
- `handleApproveCapture` (line 70): `encounterStore.captureSnapshot('Capture Attempt')` before any state modification
- `handleApproveBreather` (line 153): `encounterStore.captureSnapshot('Take a Breather')` before API call
- `handleApproveHealingItem` (line 224): `encounterStore.captureSnapshot('Use Healing Item')` before API call

All three snapshots are captured at the start of the try block, before any API calls or state mutations. This matches the pattern used in the rest of `gm/index.vue` (e.g., switch modal at line 36 of `useSwitchModalState.ts`, priority at line 522 of `gm/index.vue`).

#### HI-3: alert() blocking -- RESOLVED

**Commit:** eca48c9b (fix: replace alert() with inline error display in request handlers)

**Verified:** All three `alert()` calls in `usePlayerRequestHandlers.ts` have been replaced with `setHandlerError()`. The composable now exposes:
- `handlerError` (readonly ref) -- reactive error state
- `clearHandlerError()` -- manual dismiss
- `setHandlerError(message)` -- internal, logs to `console.error` and sets 8-second auto-clear timer

In `gm/index.vue` (lines 68-71), a `.handler-error` div displays the error inline with a dismiss click handler:
```vue
<div v-if="handlerError" class="handler-error" @click="clearHandlerError">
  <span class="handler-error__text">{{ handlerError }}</span>
  <span class="handler-error__dismiss">dismiss</span>
</div>
```

The error element has proper styling (danger background, slide-in animation) and is positioned between the PlayerRequestPanel and the main content, which is the correct visual location for GM-facing feedback. The timer cleanup pattern (clearing existing timer before setting a new one, nulling on manual clear) is correct and prevents timer leaks.

#### ME-1: app-surface.md not updated -- RESOLVED

**Commit:** 96dea1f2 (docs: add player capture & healing interfaces to app-surface.md)

**Verified:** `.claude/skills/references/app-surface.md` line 161 now documents `PlayerRequestPanel.vue`, `usePlayerRequestHandlers.ts`, `useSwitchModalState.ts`, and the player-side extensions (`requestCapture`, `requestBreather`, `requestHealingItem`). The entry also references the `constants/pokeBalls.ts` catalog. This is a comprehensive entry that covers all new files from the P0 implementation plus the fix cycle extraction.

#### ME-2: % suffix on capture rate -- RESOLVED

**Commit:** b3427228 (fix: remove misleading % suffix from capture rate preview display)

**Verified:** `PlayerRequestPanel.vue` line 26-28:
```vue
<span v-if="req.captureRatePreview != null" class="player-requests__rate">
  (Capture Rate: {{ req.captureRatePreview }})
</span>
```

The `%` suffix has been removed. The label now reads "Capture Rate: 100" (raw value) instead of "Rate: 100%". The label was also improved from "Rate" to "Capture Rate" for clarity. The `!= null` guard correctly handles both `null` and `undefined` without excluding `0` (which would be a valid rate).

#### ME-3: Empty deny reason -- RESOLVED

**Verified in two locations:**

1. `PlayerRequestPanel.vue` line 308-313: `handleDeny` still emits `reason: ''`. This is acceptable because:
2. `usePlayerRequestHandlers.ts` line 286: `reason: data.reason || 'Request denied by GM'` provides the default.

The commit eca48c9b changed the default from `'GM declined the request'` to `'Request denied by GM'`, which is a slightly clearer phrasing. The empty-string-to-default pattern is now documented by the commit message and the code flow is explicit: the component intentionally delegates default reason assignment to the handler composable. The player always receives a non-empty reason string.

This is an acceptable resolution. The concern was about fragility of the pattern, but the handler-side fallback is the correct place for this default (single source of truth for the deny reason text).

#### ME-4: Import path inconsistency -- RESOLVED

**Commit:** 3667c128 (fix: normalize import path to use ~/types barrel export)

**Verified:** `PlayerRequestPanel.vue` line 89:
```typescript
import type { WebSocketEvent, PlayerActionRequest, PlayerActionType } from '~/types'
```

All three types are now imported from the barrel `~/types` instead of mixing `~/types` and `~/types/player-sync`. This matches the convention used by `usePlayerCombat.ts` (which imports from `~/types` and `~/types/api`, both barrel exports). The barrel at `app/types/index.ts` line 38 re-exports `~/types/player-sync` via `export * from './player-sync'`.

### From rules-review-246

#### CRIT-001: 'Poke Ball' vs 'Basic Ball' mismatch -- RESOLVED

**Commit:** be612172 (fix: use DEFAULT_BALL_TYPE constant instead of 'Poke Ball' string literal)

**Verified in `usePlayerCombat.ts`:**
- Line 4: `import { DEFAULT_BALL_TYPE } from '~/constants/pokeBalls'`
- Line 364: `ballType: params.ballType ?? DEFAULT_BALL_TYPE`

**Verified in `PlayerRequestPanel.vue`:**
- Line 90: `import { DEFAULT_BALL_TYPE } from '~/constants/pokeBalls'`
- Line 278: `ballType: req.ballType ?? DEFAULT_BALL_TYPE`

Both locations now use the constant (`'Basic Ball'`) instead of the incorrect string literal `'Poke Ball'`. This prevents the 400 error that would occur when the server validates against `POKE_BALL_CATALOG` keys.

#### HIGH-001: ballType not passed to attemptCapture -- RESOLVED

**Commit:** f5bb1141 (fix: pass ballType through to attemptCapture in capture approval handler)

**Verified in `usePlayerRequestHandlers.ts` lines 82-91:**
```typescript
const result = await attemptCapture({
  pokemonId: data.targetPokemonId,
  trainerId: trainerCombatant.entityId,
  accuracyRoll: accuracyResult.roll,
  ballType: data.ballType,
  encounterContext: {
    encounterId: encounter.value.id,
    trainerCombatantId: data.trainerCombatantId
  }
})
```

The `ballType: data.ballType` property is now included in the `attemptCapture` params. The `data.ballType` comes from the `handleApproveCapture` function signature (line 64: `ballType: string`), which receives it from the `PlayerRequestPanel`'s `approve-capture` emit. The full chain is: player selects ball -> `requestCapture` sends via WS -> `PlayerRequestPanel` receives -> GM clicks Approve -> emits with `ballType` -> `handleApproveCapture` receives -> passes to `attemptCapture` -> server uses for modifier calculation. Per decree-013, this reaches the 1d100 system correctly.

#### MED-001: entityId vs combatantId in healing item handler -- RESOLVED

**Commit:** eca48c9b (within the inline error display commit, which also restructured the healing handler)

**Verified in `usePlayerRequestHandlers.ts` lines 226-230:**
```typescript
const itemResult = await encounterStore.useItem(
  data.healingItemName,
  data.trainerCombatantId,
  data.healingTargetId
)
```

The handler now passes `data.trainerCombatantId` directly to `encounterStore.useItem()` as the `userId` argument, instead of looking up the combatant and extracting `trainerCombatant.entityId`. The `useItem` store action (encounter.ts line 612) forwards this as `userId` to the `/api/encounters/:id/use-item` endpoint, which expects combatant IDs (matching the pattern in `UseItemModal.vue`). The intermediate combatant lookup that was producing the incorrect entity ID was removed entirely.

#### MED-002: Null check on attemptCapture result -- RESOLVED

**Commit:** eca48c9b (within the inline error display commit)

**Verified in `usePlayerRequestHandlers.ts` lines 94-105:**
```typescript
// Handle null result (capture failed to execute)
if (!result) {
  send({
    type: 'player_action_ack',
    data: {
      requestId: data.requestId,
      status: 'rejected',
      reason: 'Capture attempt failed to execute'
    }
  })
  setHandlerError('Capture attempt failed to execute. Player has been notified.')
  return
}
```

When `attemptCapture` returns null (internal error caught), the handler now sends a clear `rejected` ack to the player with a reason string, logs the error to the GM's inline error display, and returns early. The subsequent ack code (lines 121-134) uses non-optional access (`result.captured`, `result.captureRate`, etc.) since the null case has been handled above.

### Pre-existing issue tickets

#### PRE-EXISTING-001 (AC 6 not enforced) -- VERIFIED: bug-043 filed

**Verified:** `artifacts/tickets/open/bug/bug-043.md` exists with correct details:
- P2 priority, HIGH severity
- Source: `rules-review-246 PRE-EXISTING-001`
- Correctly identifies that `rollAccuracyCheck()` rolls 1d20 but never compares against AC 6
- Suggested fix includes the AC 6 comparison logic
- Affects both GM-initiated and player-initiated capture flows

#### PRE-EXISTING-002 (missing action endpoint) -- VERIFIED: bug-044 filed

**Verified:** `artifacts/tickets/open/bug/bug-044.md` exists with correct details:
- P3 priority, MEDIUM severity
- Source: `rules-review-246 PRE-EXISTING-002`
- Correctly identifies the non-existent `/api/encounters/:id/action` endpoint
- Notes the silent failure (try/catch swallows the error, sets warning ref)
- Recommends resolution before player capture goes live in P1

## Additional Verification

### useSwitchModalState.ts correctness check

The extracted composable at `app/composables/useSwitchModalState.ts` (136 lines) was carefully reviewed:

1. **Standard switch** (line 30): Finds combatant by ID, captures undo snapshot, sets mode to 'standard', opens modal. Correct.
2. **Fainted switch** (line 43): Same flow with 'fainted' mode. Correct.
3. **Forced switch** (line 55): Same flow with 'forced' mode. Correct.
4. **handleSwitchCompleted** (line 67): Closes modal, refreshes undo/redo, broadcasts encounter_update via WebSocket after nextTick. Matches the pattern used elsewhere in the codebase.
5. **switchModalTrainerId** computed (line 81): For human combatants, returns combatant.id directly. For Pokemon combatants, looks up trainer via `ownerId -> entityId` match. Correct -- this is the same logic that was previously inline in `gm/index.vue`.
6. **switchModalPokemonId** computed (line 96): For Pokemon combatants, returns combatant.id. For human combatants, finds their Pokemon based on mode (fainted vs standard/forced). Correct logic preserved from the extraction.
7. **switchModalTrainerEntityId** computed (line 119): Resolves the entity ID from the trainer combatant ID. Used by `SwitchPokemonModal`. Correct.

No behavioral changes from the extraction -- verified by comparing the logic against the pre-extraction version visible in the diff for commit 6a7a455f.

### File size verification

| File | Lines | Status |
|------|-------|--------|
| `app/pages/gm/index.vue` | 770 | Under 800 cap |
| `app/composables/usePlayerRequestHandlers.ts` | 300 | Appropriate |
| `app/composables/useSwitchModalState.ts` | 136 | Appropriate |
| `app/components/encounter/PlayerRequestPanel.vue` | 455 | Appropriate |
| `app/composables/usePlayerCombat.ts` | 493 | Appropriate |

### Immutability compliance

All reactive state mutations in `PlayerRequestPanel.vue` use immutable patterns:
- `requestMap.value = newMap` (new Map instance, lines 208-210, 235-243, 248-250, 256-258, 264-266)
- No `.set()` on the existing Map -- always creates a new Map first

The `usePlayerRequestHandlers.ts` composable uses `ref` for `handlerError` with direct `.value` assignment (acceptable for simple string refs).

### Error handling

- `handleApproveCapture`: try/catch with `setHandlerError` on failure, null check for `attemptCapture` result, player notified on both paths
- `handleApproveBreather`: try/catch with `setHandlerError` on failure
- `handleApproveHealingItem`: try/catch with `setHandlerError` on failure
- `handleDenyRequest`: Synchronous emit, no error path needed (WebSocket send is fire-and-forget)
- Error timer cleanup in `setHandlerError` prevents timer leaks (clears existing timer before setting new one)

### Cleanup verification

- `PlayerRequestPanel.vue` line 221-229: `onUnmounted` correctly removes the WebSocket listener and clears the timer interval
- `usePlayerRequestHandlers.ts`: The `errorTimer` is module-scoped within the composable closure, cleared by `clearHandlerError`. Since the composable is used in `gm/index.vue` which has page-level lifecycle, the timer is cleaned up on page unmount.

## What Looks Good

1. **All 12 issues from both reviews resolved.** Every CRITICAL, HIGH, and MEDIUM issue from code-review-270 and rules-review-246 has been addressed with correct fixes. No issues were half-fixed or worked around.

2. **Commit granularity is excellent.** Each of the 10 fix commits addresses exactly one issue (or a tightly related group). The commit messages clearly reference the issue being fixed. Examples: "fix: use DEFAULT_BALL_TYPE constant instead of 'Poke Ball' string literal" (CRIT-001), "fix: pass ballType through to attemptCapture" (HIGH-001).

3. **The useSwitchModalState extraction is clean.** The composable has a clear interface, handles all three switch modes, and preserves the exact behavior from the pre-extraction code. The options interface follows the same pattern as `usePlayerRequestHandlers` and `useEncounterActions`.

4. **The inline error display is well-designed.** The `handlerError` reactive state with auto-clear timer, console.error logging, and dismissible UI element is a good non-blocking replacement for `alert()`. The 8-second auto-clear is long enough for the GM to read the error but short enough not to clutter the interface.

5. **Pre-existing issues were filed as tickets.** bug-043 (AC 6 not enforced) and bug-044 (missing action endpoint) are both filed with correct metadata, affected files, and suggested fixes. They correctly reference their source review (rules-review-246).

6. **app-surface.md entry is comprehensive.** The new entry covers all new files from both the P0 implementation and the fix cycle extraction, including component descriptions, composable exports, type definitions, and constant references.

## Verdict

**APPROVED**

All 12 issues from code-review-270 and rules-review-246 have been resolved. The fixes are correct, well-scoped, and follow project patterns. The `gm/index.vue` file is now 770 lines (under the 800-line cap). Pre-existing issues have been filed as tickets (bug-043, bug-044). No new issues discovered during re-review. No decree violations.

Feature-023 P0 is clear to proceed to P1 implementation.
