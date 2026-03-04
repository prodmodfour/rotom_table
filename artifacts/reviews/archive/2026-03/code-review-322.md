---
review_id: code-review-322
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ux-012
domain: websocket
commits_reviewed:
  - 8d5abf80
  - b343d400
  - 5e0f5aec
files_reviewed:
  - app/types/api.ts
  - app/composables/useWebSocket.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/routes/ws.ts
  - artifacts/tickets/open/ux/ux-012.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 2
reviewed_at: 2026-03-04T12:10:00Z
follows_up: null
---

## Review Scope

Three commits implementing ux-012: client-side handler for `status_tick` WebSocket events. The change adds the event type to the `WebSocketEvent` discriminated union in `app/types/api.ts`, adds a `case 'status_tick':` handler in `app/composables/useWebSocket.ts` that stores tick data in a reactive ref, and updates the ticket documentation.

**Decrees checked:** decree-005 (status CS auto-apply) and decree-032 (Cursed tick on Standard Action only). Neither is violated by this change -- this is a client-side display handler that does not alter tick-firing logic. The server-side tick logic in `next-turn.post.ts` (which controls when ticks fire) is pre-existing and not modified by these commits. Per decree-032, the Cursed tick timing is a server concern; the client handler correctly treats all incoming `status_tick` events uniformly regardless of condition type.

## Issues

### CRITICAL

**C1: Single ref overwrites when multiple ticks fire in one turn**

The handler stores tick events in a single `lastStatusTick` ref. The server broadcasts ticks in a loop:

```typescript
// next-turn.post.ts lines 746-760
for (const tick of tickResults) {
  broadcastToEncounter(id, {
    type: 'status_tick',
    data: { ... }
  })
}
```

When a combatant has multiple tick conditions (e.g., Burn + Poison), or when multiple combatants take tick damage in the same turn, the ref is overwritten for each event. Only the last tick event survives for notification display. This is a data loss bug -- the whole point of this ticket is to enable meaningful notifications, and if a Pokemon has both Burn and Poison, only one notification will display.

Compare with `lastCaptureAttempt`: capture attempts happen one at a time (user clicks a button), so a single ref works. Tick damage fires in bursts at turn end.

**Fix:** Change `lastStatusTick` from a single ref to either:
- (a) An array ref that accumulates all ticks per turn cycle, with a clear mechanism, or
- (b) An array ref that a watcher can drain (consumer shifts items off as they display toasts)

The type union in `api.ts` is fine as-is since each WebSocket message is a single tick event. Only the client storage needs to handle the burst pattern.

### MEDIUM

**M1: Handler drops `encounterId` and `formula` from the stored payload**

The server broadcasts all 8 fields: `encounterId`, `combatantId`, `combatantName`, `condition`, `damage`, `newHp`, `fainted`, `formula`. The `WebSocketEvent` type in `api.ts` correctly includes all 8. But the handler's cast and spread only stores 5 fields (`combatantName`, `condition`, `damage`, `newHp`, `fainted`) plus a client-generated `timestamp`.

Missing fields:
- `encounterId` -- needed if the app ever serves multiple encounters (currently single-encounter, but defensive coding)
- `combatantId` -- needed for Player View to filter "show only my Pokemon's ticks" (the ticket mentions role-based visibility)
- `formula` -- useful for GM tooltip showing tick calculation (e.g., "1/8 max HP" vs "1/16 max HP")

The `lastStatusTick` ref type should include at minimum `combatantId` for role-based filtering. Without it, the Player View cannot determine which ticks belong to the player's own Pokemon.

**M2: Resolution log cites wrong commit hashes**

The ticket resolution log references `faff273e` and `e672db94`, but the actual commits are `8d5abf80` and `b343d400`. These appear to be hashes from a different branch or rebase. The resolution log should reference the correct commits for traceability.

## What Looks Good

- **Type union placement is correct.** The `status_tick` entry sits logically next to `combatant_removed` in the combat events section, consistent with the grouping convention.
- **Handler pattern matches existing precedent.** The `case 'status_tick':` follows the same guard-then-cast-then-spread pattern used by `capture_attempt`, including the defensive `typeof message.data === 'object'` check.
- **Reactive ref exposed as `readonly()`.** Prevents consumers from mutating WebSocket-received data, matching the immutability pattern used for all other exposed refs in the composable.
- **Commit granularity is appropriate.** Three commits: type change, handler logic, docs update -- each is a single logical change.
- **No decree violations.** The client handler is purely a display concern; tick-firing logic (including decree-032 Cursed timing) remains entirely server-side and is not touched.

## Verdict

**CHANGES_REQUIRED** -- The single-ref overwrite issue (C1) defeats the purpose of the ticket. Multiple tick events per turn is a common scenario (Burn + Poison on one combatant, or ticks on multiple combatants), and only the last event would survive for notification display.

## Required Changes

1. **C1 (CRITICAL):** Replace the single `lastStatusTick` ref with an approach that preserves all tick events from a turn cycle. Recommended: use an array ref (e.g., `statusTickQueue`) that accumulates events, with the ref type updated to match. Consumers can watch the array length and drain entries as they display toasts.

2. **M1 (MEDIUM):** Include `combatantId` in the stored payload (at minimum). This is required for Player View to filter ticks to only the player's own Pokemon. Including `formula` is recommended for GM tooltip display. Update both the ref type declaration and the handler cast/spread.

3. **M2 (MEDIUM):** Fix the resolution log commit hashes in `artifacts/tickets/open/ux/ux-012.md` to reference `8d5abf80` and `b343d400`.
