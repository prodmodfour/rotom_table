---
review_id: code-review-307
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-044
domain: capture
commits_reviewed:
  - 225c16a6
  - aabbc668
  - 28bfcf12
files_reviewed:
  - app/server/api/encounters/[id]/action.post.ts
  - app/server/api/capture/attempt.post.ts
  - app/composables/useCapture.ts
  - app/stores/encounter.ts
  - app/composables/usePlayerRequestHandlers.ts
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/pass.post.ts
  - app/types/api.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-03T19:30:00Z
follows_up: null
---

## Review Scope

First review of bug-044 fix: Standard Action consumption endpoint was missing. `useCapture.ts` (line 209), `usePlayerRequestHandlers.ts` (line 87), and the encounter store's `useAction()` method (line 1037) all called `POST /api/encounters/{id}/action`, but the endpoint did not exist. Because callers wrapped the call in try/catch, it failed silently and Standard Actions were never consumed during capture attempts.

Commit 225c16a6 creates the missing endpoint. Commits aabbc668 and 28bfcf12 are adjacent capture-domain changes (Friend Ball loyalty DB write and WebSocket capture_attempt broadcast) included in the review scope.

Decrees checked: decree-013 (core 1d100 capture, not d20 playtest), decree-042 (full accuracy system on Poke Ball throws). Neither decree constrains the action consumption endpoint directly. The endpoint only marks `turnState.standardActionUsed = true`; it does not touch capture mechanics or accuracy rolls. No violations.

## Commit 225c16a6: `action.post.ts` (83 lines)

### Structure and Pattern Compliance

The endpoint follows the established `pass.post.ts` pattern correctly:

1. Parse `id` from route param, parse `combatantId` and `actionType` from body
2. Validate required fields with early-return 400 errors
3. `loadEncounter(id)` -> `findCombatant(combatants, combatantId)` (both from encounter.service)
4. Validate action not already consumed (400 on double-use)
5. Immutable spread update on `combatant.turnState`
6. `saveEncounterCombatants(id, combatants)` -> `buildEncounterResponse(record, combatants)`
7. Return `{ success: true, data: response }`

Error handling follows the project convention: known H3 errors (with `statusCode`) are re-thrown; unknown errors are wrapped in a 500.

### Validation

The `validActions` array (`['standard', 'shift', 'swift']`) and `fieldMap` mapping to `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed` correctly cover all three PTU action types. The double-use guard (`if (combatant.turnState[field])`) prevents the same action from being consumed twice in a single turn.

### Immutability

Line 62-65 uses spread (`{ ...combatant.turnState, [field]: true }`) rather than direct mutation. Correct pattern.

### Caller Verification

All three callers send the correct shape:

- `useCapture.ts:209` sends `{ combatantId: trainerCombatantId, actionType: 'standard' }`
- `encounter.ts:1041` sends `{ combatantId, actionType }` where `actionType` is typed as `'standard' | 'shift' | 'swift'`
- `usePlayerRequestHandlers.ts:87` sends `{ combatantId: data.trainerCombatantId, actionType: 'standard' }`

All match the endpoint's expected body schema.

### Difference from pass.post.ts

`pass.post.ts` writes directly via `prisma.encounter.update()` because it also appends to the moveLog. `action.post.ts` uses the service-layer `saveEncounterCombatants()` which only persists combatant state. This is correct -- consuming a single action has no move-log side effect.

However, `pass.post.ts` also calls `buildEncounterResponse(record, combatants, { moveLog })` passing the updated moveLog, while `action.post.ts` calls `buildEncounterResponse(record, combatants)` without passing moveLog overrides. This is correct because `action.post.ts` does not modify the moveLog; the record's moveLog is unchanged and `buildEncounterResponse` will parse it from the record.

## Commit aabbc668: Friend Ball +1 Loyalty DB Update

The `as any` casts on lines 192 and 196 are necessary workarounds because the Prisma client type was generated before the `loyalty` field was added to the schema (or the generated client is not up to date). The schema does have the field (`loyalty Int @default(3)` at line 160 of schema.prisma), so the runtime behavior is correct. The `Math.min(6, currentLoyalty + 1)` correctly caps loyalty at the PTU maximum of 6.

The default fallback `(pokemon as any).loyalty ?? 2` uses 2 (Wary), but the schema default is 3 (Neutral). See MED-001 below.

## Commit 28bfcf12: WebSocket capture_attempt Broadcast

The broadcast correctly sends capture result data to all connected clients. The `capture_attempt` event type is registered in the `WebSocketEvent` discriminated union in `app/types/api.ts` (line 60), matching the broadcast payload shape. The broadcast is placed after all DB writes (loyalty, trainer XP) and before the HTTP response, which is the correct position.

## Issues

### MEDIUM

**MED-001: Friend Ball loyalty fallback default mismatch**

File: `app/server/api/capture/attempt.post.ts` line 192
Commit: aabbc668

```typescript
const currentLoyalty = (pokemon as any).loyalty ?? 2
```

The nullish coalescing fallback is `2` (Wary), but `schema.prisma` declares `loyalty Int @default(3)` (Neutral). If a Pokemon record somehow has a null/undefined loyalty, the fallback should be `3` to match the schema default. In practice this is unlikely to trigger because Prisma enforces the default on insert, but the mismatch is confusing for anyone reading the code.

**MED-002: Server CLAUDE.md broadcast event list not updated**

File: `app/server/CLAUDE.md`
Commit: 28bfcf12

The Server CLAUDE.md lists broadcast events under "Broadcast Events (relayed by server)" but does not include `capture_attempt`. The type system (`api.ts`) is already updated, but the documentation should stay in sync. This is an existing documentation pattern issue that the developer should fix while already in the capture domain.

## What Looks Good

1. **Clean, focused endpoint.** 83 lines with clear validation, immutable state updates, and proper error handling. Well within the 800-line limit.
2. **Correct use of service layer.** Delegates to `loadEncounter`, `findCombatant`, `saveEncounterCombatants`, and `buildEncounterResponse` from encounter.service rather than using Prisma directly. Follows the API CLAUDE.md service delegation rule.
3. **Generic design.** Supports all three action types (standard/shift/swift) rather than being capture-specific. This makes the endpoint reusable for any future action consumption needs.
4. **Caller compatibility verified.** All three existing callers send payloads matching the endpoint's validation requirements.
5. **Good JSDoc header.** Documents PTU page reference (p.218), request body shape, and the caller-is-responsible-for-effect contract.
6. **Commit granularity is correct.** Each of the three commits addresses one logical change: endpoint creation, Friend Ball loyalty wiring, and WebSocket broadcast.
7. **WebSocket type safety.** The `capture_attempt` event is registered in the discriminated union type before the broadcast was added.

## Verdict

**APPROVED.** The primary fix (action.post.ts) is correct, well-structured, and solves the bug as described. The two adjacent commits are sound. Two MEDIUM issues noted for cleanup but do not block.

## Required Changes

None blocking. MED-001 and MED-002 should be addressed in the next visit to the capture domain.
