---
review_id: code-review-270
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-view+capture+healing
commits_reviewed:
  - e4e9a639
  - 0379fb83
  - 9a6b9bee
  - c9ec6aec
  - 5271574d
  - c9dd7374
files_reviewed:
  - app/types/player-sync.ts
  - app/composables/usePlayerCombat.ts
  - app/components/encounter/PlayerRequestPanel.vue
  - app/composables/usePlayerRequestHandlers.ts
  - app/pages/gm/index.vue
  - app/server/routes/ws.ts
  - artifacts/designs/design-player-capture-healing-001/_index.md
  - artifacts/tickets/open/feature/feature-023.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 4
reviewed_at: 2026-03-02T12:00:00Z
follows_up: null
---

## Review Scope

First review of feature-023 P0: Player Capture & Healing Interfaces. This tier extends `PlayerActionType` with three new action types (`capture`, `breather`, `use_healing_item`), adds request functions to `usePlayerCombat`, creates a `PlayerRequestPanel` component for the GM, extracts event handlers into `usePlayerRequestHandlers`, and wires everything into the GM encounter page.

6 commits reviewed spanning 7 files changed, +831 lines.

**Decrees checked:** decree-013 (1d100 capture system), decree-014 (stuck/slow separate), decree-015 (real max HP for capture), decree-017 (PC heals to effective max), decree-029 (rest healing min 1 HP). No decree violations found. The capture path delegates to the existing `useCapture.attemptCapture()` which calls `/api/capture/attempt` -- confirmed to use the 1d100 system per decree-013. Stuck/Slow and HP calculations are handled by the pre-existing `captureRate.ts` and are not modified here.

## Issues

### CRITICAL

#### CR-1: GM encounter page is 812 lines -- at the 800-line file size limit

**File:** `app/pages/gm/index.vue` (812 lines)

The page was already near the limit and the P0 wiring pushed it to 812 lines. The project standard is a hard cap of 800 lines. The developer correctly extracted the handlers into `usePlayerRequestHandlers.ts` (good SRP instinct), but the 6 lines of destructured return + 9 lines of `<PlayerRequestPanel>` template wiring still tipped the file over.

The fix is straightforward: extract more logic from `gm/index.vue` into composables. Candidates include the switch-modal computed props (lines 460-502, ~42 lines) or the template-related handlers (lines 736-751, ~16 lines). Moving the switch-modal block alone would bring the file to ~770 lines with comfortable headroom.

### HIGH

#### HI-1: `encounterId` prop accepted but never used in PlayerRequestPanel

**File:** `app/components/encounter/PlayerRequestPanel.vue` (line 122-124)

The component accepts `encounterId` as a required prop but never references it. The WebSocket listener inside the component listens for ALL `player_action` messages regardless of encounter context. If the GM has the panel mounted while WebSocket messages from different encounters arrive (unlikely but possible during encounter transitions), requests from the wrong encounter would appear.

**Fix:** Either filter incoming requests by encounter context (if available in the message payload), or remove the unused prop to avoid misleading callers. Given that the WS server already scopes `player_action` forwarding to the encounter room (verified in `ws.ts` line 374), the prop is defensively correct but unused. At minimum, add a comment explaining why it exists, or remove it and rely on the server-side scoping.

#### HI-2: No undo snapshot captured before capture/breather/healing approval

**File:** `app/composables/usePlayerRequestHandlers.ts`

The GM encounter page captures undo snapshots before destructive actions (e.g., `encounterStore.captureSnapshot('Switch Pokemon')` at line 415 of `gm/index.vue`). The `handleApproveCapture`, `handleApproveBreather`, and `handleApproveHealingItem` handlers all modify encounter state but none call `encounterStore.captureSnapshot()` before doing so.

This means the GM cannot undo a mistaken capture approval, breather approval, or healing item approval. All three are state-changing operations that should be undoable.

**Fix:** Add `encounterStore.captureSnapshot('Capture: <pokemonName>')` (and similar for breather/healing) at the start of each handler, before any API calls.

#### HI-3: Error handling uses `alert()` for all failure cases

**File:** `app/composables/usePlayerRequestHandlers.ts` (lines 93-95, 160-162, 213-215)

All three approval handlers use `alert()` for error reporting. This is a blocking synchronous dialog that freezes the entire GM interface. If the GM has multiple pending requests and one fails, they cannot interact with the UI until dismissing the alert.

The project has a move log and GM notification patterns. These errors should use a non-blocking mechanism (toast notification, inline error state, or similar). At minimum, `console.error` + a visual indicator on the panel is better than `alert()`.

**Fix:** Replace `alert()` calls with a non-blocking notification pattern. If no toast system exists yet, at minimum emit an error event up to the parent or log to console.error and set a reactive error state.

### MEDIUM

#### ME-1: `app-surface.md` not updated with new component and composable

**File:** `.claude/skills/references/app-surface.md`

The design spec checklist includes updating the app surface map when adding new components/composables. `PlayerRequestPanel.vue` and `usePlayerRequestHandlers.ts` are not listed in the app surface.

**Fix:** Add entries for both to the appropriate sections of `app-surface.md`.

#### ME-2: captureRatePreview displayed as percentage but server returns raw capture rate

**File:** `app/components/encounter/PlayerRequestPanel.vue` (line 26-28)

The template displays `(Rate: {{ req.captureRatePreview }}%)` with a `%` suffix. However, the capture rate from `calculateCaptureRate` is a raw value (0-255 scale, where 100 is the base). Displaying it with `%` is misleading -- a rate of 100 does not mean 100% chance. The actual capture probability depends on the d100 roll vs effective capture rate after trainer level and ball modifiers.

**Fix:** Either remove the `%` suffix and display as a raw value (e.g., "Rate: 100"), or convert to actual probability percentage before display. Since this is a preview sent from the player side, it should be labeled clearly (e.g., "Base Rate: 100" or "Capture Rate: 100/255").

#### ME-3: Deny handler sends empty reason string

**File:** `app/components/encounter/PlayerRequestPanel.vue` (lines 309-315)

The `handleDeny` function always sends `reason: ''`. The design spec noted "Could add an input for reason, but keeping it simple." The `handleDenyRequest` composable then defaults to `'GM declined the request'` if the reason is empty. This works, but the player never gets a meaningful reason.

**Fix:** Either pass a default reason from the component (e.g., `reason: 'Request denied by GM'`) so it is explicitly set rather than relying on fallback logic, or add a simple optional input. Not blocking, but the current empty-string-to-default pattern is fragile.

#### ME-4: PlayerRequestPanel imports from both `~/types` and `~/types/player-sync`

**File:** `app/components/encounter/PlayerRequestPanel.vue` (lines 89-90)

```typescript
import type { WebSocketEvent } from '~/types'
import type { PlayerActionRequest, PlayerActionType } from '~/types/player-sync'
```

The `PlayerActionRequest` is re-exported from `~/types/api` (which is the standard import path used elsewhere, e.g., in `usePlayerCombat.ts`). Importing directly from `~/types/player-sync` bypasses the barrel export. This works but introduces an inconsistency -- `usePlayerCombat.ts` imports from `~/types/api` while `PlayerRequestPanel.vue` imports from `~/types/player-sync`.

**Fix:** Use `~/types/api` for consistency, or import from `~/types` if it re-exports there. Minor but prevents confusion about canonical import paths.

## What Looks Good

1. **SRP extraction of usePlayerRequestHandlers.** The developer proactively extracted the GM-side handlers into a separate composable to keep `gm/index.vue` manageable. This was not in the original design spec and shows good architectural judgment. The composable has a clean interface with typed options.

2. **Immutable Map updates in PlayerRequestPanel.** Every mutation of `requestMap` creates a new `Map` instance (`const newMap = new Map(requestMap.value)`). This correctly follows the project's immutability rules and ensures Vue reactivity triggers properly.

3. **Request lifecycle management.** The TTL-based expiration (60 seconds), status transitions (pending -> processing -> resolved), and cleanup on unmount are well-implemented. The `pruneExpiredRequests` function runs on the timer interval without creating unnecessary reactive updates (only sets new Map when pruning actually occurs).

4. **WebSocket plumbing is correct.** The existing `player_action` and `player_action_ack` message types in `ws.ts` (lines 372-387) already handle the routing correctly. Player actions are forwarded to GMs via `forwardToGm` (with requestId registration), and acks are routed back to the originating player via `routeToPlayer`. No server-side changes were needed, which confirms the protocol design was forward-compatible.

5. **Type extensions follow Open/Closed principle.** New action types and optional fields were added to existing types without breaking any existing consumers. The `PlayerActionRequest` interface grows via optional fields, and existing code constructing requests for `use_item`, `switch_pokemon`, etc. is unaffected.

6. **Commit granularity is appropriate.** Each commit represents a single logical change: type extensions, request functions, component creation, handler extraction, wiring, and artifact updates. The refactor extraction (commit 4) was correctly separated from the component creation (commit 3).

7. **Phosphor Icons used correctly.** The component imports `PhUsers`, `PhCheck`, `PhX`, `PhTarget`, `PhHeartbeat`, `PhFirstAidKit` from `@phosphor-icons/vue` rather than using emojis.

8. **Design spec and ticket artifacts updated.** Both the `_index.md` and `feature-023.md` were updated with P0 completion status and commit references.

## Verdict

**CHANGES_REQUIRED**

The 812-line file size violation on `gm/index.vue` is a CRITICAL issue per project standards. The missing undo snapshots (HI-2) and blocking `alert()` calls (HI-3) are HIGH issues that should be fixed while the developer is in this code. The unused prop (HI-1) needs resolution.

## Required Changes

1. **CR-1:** Extract switch-modal computed props or other logic from `gm/index.vue` to bring it under 800 lines.
2. **HI-1:** Either use the `encounterId` prop for filtering, remove it, or add a comment explaining the server-side scoping.
3. **HI-2:** Add `encounterStore.captureSnapshot()` calls at the start of `handleApproveCapture`, `handleApproveBreather`, and `handleApproveHealingItem`.
4. **HI-3:** Replace `alert()` with non-blocking error handling in all three approval handlers.
5. **ME-1:** Update `app-surface.md` with `PlayerRequestPanel.vue` and `usePlayerRequestHandlers.ts`.
6. **ME-2:** Fix or clarify the `%` suffix on capture rate preview display.
7. **ME-3:** Pass explicit deny reason instead of relying on empty-string fallback.
8. **ME-4:** Normalize import path for `PlayerActionRequest`/`PlayerActionType` to match project conventions.
