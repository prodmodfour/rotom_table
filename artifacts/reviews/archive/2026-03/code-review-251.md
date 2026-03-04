---
review_id: code-review-251
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-016
domain: combat
commits_reviewed:
  - 6f830968
  - d975924f
  - 013b2e4f
  - e4ea946f
  - 30130b8a
  - 2550cf31
  - 16a71256
  - cdabd646
  - af9f48f5
files_reviewed:
  - app/server/api/encounters/[id]/aoo-resolve.post.ts
  - app/server/api/encounters/[id]/aoo-detect.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/services/out-of-turn.service.ts
  - app/constants/aooTriggers.ts
  - app/composables/useGridMovement.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-01T15:40:00Z
follows_up: code-review-247
---

## Review Scope

Re-review of feature-016 P0 (Priority/Interrupt/Attack of Opportunity System) fix cycle. 9 commits addressing 8 issues (1 CRIT, 3 HIGH, 4 MEDIUM) from code-review-247. rules-review-223 previously APPROVED. All source files read and verified against the original review's required changes.

## Decree Compliance

- **decree-032** (Cursed tick on Standard Action only): Not impacted by fix cycle. Compliant.
- **decree-033** (Fainted switch on trainer's next turn): Not impacted. Compliant.
- **decree-039** (Roar blocked by Trapped): Not impacted. Compliant.

No new ambiguities discovered.

## Fix Verification

### CRIT-001: Fainted reactor can execute AoO -- FIXED

**Commit:** `6f830968` -- `aoo-resolve.post.ts` lines 88-102

The fix adds a `canUseAoO(reactor)` re-validation check before processing an accepted AoO. If the reactor's HP <= 0, has a blocking condition, or has already used their AoO this round, the endpoint now throws a 400 error with the specific reason. This is the correct approach (option 2 from the original review). The check runs after finding the action but before calling `resolveAoOAction`, which ensures no side effects occur if the reactor is ineligible. Verified.

### HIGH-001: triggerType input not validated -- FIXED

**Commit:** `d975924f` -- `aoo-detect.post.ts` lines 55-62

The fix validates `triggerType` against `Object.keys(AOO_TRIGGER_MAP)` before entering the try block. Returns a 400 error with a descriptive message listing valid trigger types. This prevents the `undefined.description` TypeError from the original issue. Verified.

### HIGH-002: AOO_STRUGGLE_ATTACK_DAMAGE_BASE 10 to 11 -- FIXED

**Commit:** `013b2e4f` -- `aooTriggers.ts` lines 64-69

Value changed from 10 to 11. Comment updated to "PTU: DB4 = 1d8+6 (Physical, Typeless, Melee). In set damage mode, DB4 avg = 11 (per DAMAGE_BASE_CHART)." Matches the PTU DB4 set damage chart `[7, 11, 14]`. Verified.

### HIGH-003: app-surface.md not updated -- FIXED

**Commit:** `cdabd646` -- `app-surface.md`

Added: both endpoints (`aoo-detect`, `aoo-resolve`) in the encounters section, a comprehensive "Attack of Opportunity system" paragraph covering the service, constants, utility, component, store additions, types, VTT integration, WebSocket events, and round reset details. Also added `out-of-turn.service.ts` to the Server Services table. This is thorough and well-documented. Verified.

### MED-001: Client AoO preview doesn't check eligibility -- FIXED

**Commit:** `e4ea946f` -- `useGridMovement.ts` lines 629-637

The `getAoOTriggersForMove` function now filters out ineligible reactors: HP <= 0, Fainted/Dead status, `AOO_BLOCKING_CONDITIONS` (Asleep, Bad Sleep, Flinched, Paralyzed), and `aooUsed` flag. Uses the shared `AOO_BLOCKING_CONDITIONS` constant from `types/combat.ts` to stay consistent with the server-side check. This prevents false positive AoO indicators in the VTT preview. Verified.

### MED-002: Faint auto-decline -- PARTIALLY FIXED (acceptable)

**Commit:** `30130b8a` -- `aoo-resolve.post.ts` lines 184-200

The fix auto-declines pending AoOs where the fainted trigger target matches `triggerId`. When the trigger target faints from a Struggle Attack, all other pending AoOs targeting the same trigger are auto-declined. The `applyFaintStatus` call is also correctly added for the fainted trigger target.

**Residual observation:** The fix handles `triggerId` matching but not the case where the fainted trigger target is also a pending *reactor* (`actorId`) for a different AoO. The `autoDeclineFaintedReactor` function (which handles `actorId` matching) is imported but never called. However, CRIT-001's re-validation guard fully prevents a fainted reactor from executing, making this a cosmetic UX issue (the GM would see a stale prompt that 400-rejects on accept). This is not blocking because the correctness is preserved by CRIT-001. See MED-001 below for a ticket on the unused import.

### MED-003: Stale record in detect -- FIXED

**Commit:** `2550cf31` -- `aoo-detect.post.ts` lines 112-130

The `prisma.encounter.update` return value is now captured as `updatedRecord` and passed to `buildEncounterResponse`. This ensures the response uses the database-committed state rather than the pre-update `record`. Verified.

### MED-004: Pending actions accumulation -- FIXED

**Commit:** `16a71256` -- `out-of-turn.service.ts` lines 319-330 and `next-turn.post.ts` lines 395-402

A new `cleanupResolvedActions(pendingActions, currentRound)` function filters the action array to keep only pending actions and resolved/declined/expired actions from the current round. It's chained after `expirePendingActions` in the round-transition block of `next-turn.post.ts`. The pipeline is correct: expire old-round pending actions first, then strip out non-pending actions from past rounds. This prevents indefinite JSON blob growth. Verified.

## Issues

### MEDIUM

#### MED-001: `autoDeclineFaintedReactor` imported but never called in `aoo-resolve.post.ts`

**File:** `app/server/api/encounters/[id]/aoo-resolve.post.ts` (line 21)

The `autoDeclineFaintedReactor` function is imported from `out-of-turn.service.ts` but is never invoked anywhere in the endpoint. The MED-002 fix inlined the trigger-side auto-decline logic directly (lines 184-200), and the reactor-side case is protected by CRIT-001. This leaves a dead import that creates confusion about intent.

**Fix required:** Either:
1. Remove the unused import of `autoDeclineFaintedReactor`, or
2. Use it to also auto-decline AoOs where the fainted trigger target is a pending reactor (actorId), which would fully address the original MED-002 scope and clean up stale GM prompts proactively.

Option 2 is preferred. After the trigger-side auto-decline block (line 200), add:

```typescript
// Also auto-decline if the fainted target was a pending reactor for other AoOs
updatedActions = autoDeclineFaintedReactor(updatedActions, trigger.id)
```

This is not blocking because CRIT-001 prevents actual execution, but it's dead code that should be resolved.

## What Looks Good

1. **Fix ordering is logical.** The commits progress from most critical (CRIT-001 first) to least (docs last). Each commit is atomic and focused on exactly one issue.

2. **CRIT-001 fix is defensive and minimal.** Re-validating via the existing `canUseAoO` function reuses proven logic rather than duplicating checks. The error message surfaces the specific reason (fainted, sleeping, etc.) which helps the GM understand what happened.

3. **HIGH-001 validation provides a helpful error message.** The error lists all valid trigger types, which aids debugging if a caller sends an incorrect value.

4. **MED-001 uses the shared constant.** Importing `AOO_BLOCKING_CONDITIONS` from `types/combat.ts` ensures the client and server agree on which conditions block AoO, preventing drift if conditions are added later.

5. **MED-004 cleanup is well-placed.** Running cleanup at round boundaries (alongside declaration clearing and action expiry) is the natural place for housekeeping. The `cleanupResolvedActions` function is pure and returns a new array (immutable pattern).

6. **app-surface.md update is comprehensive.** The new paragraph covers every artifact introduced by feature-016 P0, including types, constants, utilities, service, component, store additions, WebSocket events, and round-reset integration.

7. **File sizes are healthy.** `out-of-turn.service.ts` (367 lines), `aoo-resolve.post.ts` (267 lines), `aoo-detect.post.ts` (149 lines), `useGridMovement.ts` (669 lines) -- all well within the 800-line limit.

## Verdict

**APPROVED**

All 8 issues from code-review-247 have been addressed. The CRIT-001 correctness bug is fully resolved with a server-side re-validation guard. The three HIGH issues (input validation, constant value, app-surface docs) are correctly fixed. The four MEDIUM issues (client preview, faint auto-decline, stale record, action cleanup) are resolved. One new MEDIUM issue identified (unused import / incomplete reactor-side auto-decline), but it is non-blocking because CRIT-001 prevents the underlying correctness risk. The fix should be cleaned up in a follow-up pass or during P1 implementation.

## Required Changes

None (APPROVED). The MED-001 unused import should be cleaned up at the next opportunity but is not blocking this approval.
