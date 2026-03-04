---
review_id: code-review-227
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-010
domain: combat
commits_reviewed:
  - cbef558
  - 74de564
  - 9d577b1
  - 100a8e2
  - 488f01b
  - 2c0d13c
  - 2eb516e
  - 4acc128
files_reviewed:
  - app/server/services/status-automation.service.ts
  - app/types/encounter.ts
  - app/constants/statusConditions.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/services/combatant.service.ts
  - app/server/routes/ws.ts
  - app/tests/unit/services/status-automation.service.test.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/services/entity-update.service.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-02-28T23:30:00Z
follows_up: null
---

## Review Scope

P0 implementation of feature-010 (Status Condition Automation Engine): tick damage at turn end for Burn, Poison, Badly Poisoned, and Cursed. 8 commits across 8 files (703 lines added). Design spec: `design-status-automation-001/spec-p0.md`.

Verified against:
- decree-032 (Cursed tick fires only on actual Standard Action use)
- decree-012 (type immunity checked at application time, tick damage bypasses this per spec D7)
- decree-004 (massive damage uses real HP after temp HP absorption -- `calculateDamage` already correct)
- decree-005 (CS auto-apply -- `applyDamageToEntity` reverses on faint, preserving this)
- decree-021 (League Battle phases -- tick damage correctly skips `trainer_declaration`)

## Issues

### HIGH

#### H1: `standardActionUsed` is never set to `true` by `move.post.ts` -- Cursed tick damage will never fire after using a move

The Cursed tick condition gates on `currentCombatant.turnState?.standardActionUsed ?? false` (next-turn.post.ts line 152). However, `move.post.ts` (the primary way combatants use Standard Actions) does NOT set `turnState.standardActionUsed = true`. It only decrements `actionsRemaining`. The flag is only set to `true` by `pass.post.ts` and `breather.post.ts`.

This means Cursed tick damage will only fire when the GM manually passes or uses Take a Breather -- NOT when a move is used, which is the overwhelmingly common case.

**This is a pre-existing issue** (the `standardActionUsed` tracking was never wired into `move.post.ts`), but the status-automation feature now depends on it for correctness. The developer should have either:
1. Fixed `move.post.ts` to set `standardActionUsed = true` when a Standard Action move is executed, OR
2. Documented this limitation and filed a ticket

**Impact:** Cursed combatants who use a Standard Action (via a move) will NOT take tick damage. This is a PTU rules violation and defeats the purpose of automating Cursed tick damage.

**Fix:** In `move.post.ts`, after `actor.actionsRemaining--`, add:
```typescript
if (actor.turnState) {
  actor.turnState = { ...actor.turnState, standardActionUsed: true }
}
```
Additionally, the same fix should be applied in `damage.post.ts` if it represents a Standard Action. However, `move.post.ts` is the primary concern since move execution IS a Standard Action. A separate ticket for comprehensive `standardActionUsed` tracking across all Standard Action endpoints would be appropriate.

**File:** `app/server/api/encounters/[id]/move.post.ts` (not part of this PR but blocking correctness)

### MEDIUM

#### M1: `app-surface.md` not updated with new `status-automation.service.ts`

The new service file `app/server/services/status-automation.service.ts` is not listed in `.claude/skills/references/app-surface.md`. Per the review checklist: "If new endpoints/components/routes/stores: was `app-surface.md` updated?" The services section at line ~232 lists all other services but omits this one.

**Fix:** Add the following line to the services section of `app-surface.md`:
```
| `server/services/status-automation.service.ts` | Tick damage automation — calculateTickDamage, calculateBadlyPoisonedDamage, getTickDamageEntries, getCombatantName |
```

Also add `status_tick` to the WebSocket events section if one exists.

**File:** `.claude/skills/references/app-surface.md`

#### M2: Client-side `status_tick` WebSocket event not handled -- no real-time tick damage feedback for Group/Player views

The server broadcasts `status_tick` events (ws.ts line 349-354), but the client-side WebSocket handler (`composables/useWebSocket.ts`) has no case for `status_tick`. These events are silently dropped.

The state sync still works because `gm/index.vue` broadcasts a full `encounter_update` after `nextTurn()` completes (line 434-437), which includes the post-tick-damage HP values. So this is not a data correctness issue.

However, without a `status_tick` handler, Group/Player views cannot show toast notifications or visual feedback specifically for tick damage events (e.g., "Pikachu lost 7 HP from Burn"). This is a UX gap that will matter for P1/P2 when more status automation events occur.

**Fix for P0:** Acceptable to defer, but file a ticket. The WebSocket event type is registered server-side and broadcast -- the client just needs a handler.

**Fix for P1:** Add a `case 'status_tick':` handler in `useWebSocket.ts` that triggers a toast/notification.

## What Looks Good

### Architecture

1. **Clean service separation.** `status-automation.service.ts` contains pure functions with no side effects. `calculateTickDamage`, `calculateBadlyPoisonedDamage`, and `getTickDamageEntries` are testable in isolation. The `getCombatantName` helper is appropriately co-located. This follows the SRP pattern prescribed in CLAUDE.md.

2. **Correct placement in next-turn.post.ts.** Tick damage fires AFTER the combatant's actions but BEFORE the turn index advances, matching PTU's "at the end of that turn" timing. The `trainer_declaration` phase guard is correct (per decree-021, declaration is not a real turn).

3. **Well-typed interfaces.** `TickDamageResult` and `TickDamageEntry` are cleanly separated -- entries are the pre-application calculation, results are the post-application state including newHp, injuryGained, and fainted.

### PTU Rules Compliance

4. **Burn/Poison always fire** regardless of `standardActionTaken`. Per spec D1 and PTU p.246-247: "takes a Standard Action or is prevented from taking a Standard Action" -- in combat, one of these is always true.

5. **Cursed correctly gates on `standardActionTaken`** per decree-032. The deliberate textual difference between Burn/Poison and Cursed is respected.

6. **Badly Poisoned supersedes Poisoned** (spec E3). The `if/else if` structure at lines 108-124 ensures only Badly Poisoned damage applies when both conditions are present, preventing double-tick.

7. **Badly Poisoned escalation formula is correct.** `5 * 2^(round - 1)` produces the expected sequence: 5, 10, 20, 40, 80...

8. **Tick uses base `maxHp`, not injury-reduced** (spec D5). The service reads `entity.maxHp` which is the natural health pool.

9. **Faint mid-loop handled** (spec E2). The `if (currentCombatant.entity.currentHp <= 0) break` inside the tick entry loop prevents applying subsequent tick entries after the first entry causes fainting. `applyDamageToEntity` correctly clears Persistent/Volatile conditions on faint, and the `badlyPoisonedRound` increment at line 192 correctly checks the (now-cleared) status conditions.

### Damage Pipeline Integration

10. **Tick damage routes through `calculateDamage()`** which handles temp HP absorption, HP marker crossings, massive damage rule (per decree-004), and faint detection. Tick damage gets the same injury tracking as regular damage. This is correct per spec D4.

11. **DB sync after each tick entry** ensures that if the server crashes between processing Burn and Cursed tick damage, the partial state is saved. Each `syncEntityToDatabase` call persists HP, tempHP, injuries, statusConditions, and lastInjuryTime.

### Move Log Integration

12. **Tick damage events logged to moveLog** with proper structure matching `MoveLogEntry` pattern. `moveName` uses `"${condition} Tick"` format, `damageClass` is `'Status'`, and the formula is in `notes`.

### Testing

13. **23 unit tests** cover the pure functions comprehensively: tick calculation, badly poisoned escalation, all condition types, minimum tick of 1, fainted skip, Badly Poisoned supersedes Poisoned, multi-condition stacking, Cursed standard-action gating. Test helpers (makeCombatant, makePokemonEntity, makeHumanEntity) are well-structured.

14. **Edge cases tested:** HP=0 faint skip, both Poisoned+Badly Poisoned present, Cursed with standardActionTaken=false, minimum tick for low maxHp (5), round 0 default to round 1.

### Commit Granularity

15. **8 small commits** with clear conventional-commit messages, each touching 1-3 files. The commit order follows the implementation plan: types -> builder -> constants -> endpoint integration -> WebSocket -> tests -> status management. Each commit produces a compilable state.

## Verdict

**CHANGES_REQUIRED**

The implementation is architecturally sound, PTU-rule-faithful, well-tested, and follows project patterns. However, the HIGH issue (H1) means Cursed tick damage is effectively broken in the most common combat scenario -- it will never fire when a combatant uses a move, because `move.post.ts` does not set `turnState.standardActionUsed = true`. Since the status-automation feature explicitly depends on this flag, the developer must fix this gap before P0 can be approved.

## Required Changes

1. **[HIGH - H1]** Fix `move.post.ts` to set `turnState.standardActionUsed = true` when a Standard Action move is executed. This is the minimum fix needed. Consider also filing a ticket for comprehensive `standardActionUsed` tracking across all Standard Action endpoints (sprint, maneuvers, etc.).

2. **[MEDIUM - M1]** Update `app-surface.md` with the new `status-automation.service.ts` service entry.

3. **[MEDIUM - M2]** File a ticket for client-side `status_tick` WebSocket handler (acceptable to defer implementation to P1, but the ticket should exist now).
