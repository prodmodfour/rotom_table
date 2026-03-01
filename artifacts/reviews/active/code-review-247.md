---
review_id: code-review-247
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-016
domain: combat
commits_reviewed:
  - 3fbec585
  - 0f80b687
  - b0aaaf58
  - 1fa9f855
  - d3f78812
  - ad906fd3
  - 605495c3
  - c058bf89
  - f6d2a24b
files_reviewed:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/constants/aooTriggers.ts
  - app/utils/adjacency.ts
  - app/server/services/out-of-turn.service.ts
  - app/server/api/encounters/[id]/aoo-detect.post.ts
  - app/server/api/encounters/[id]/aoo-resolve.post.ts
  - app/prisma/schema.prisma
  - app/composables/useGridMovement.ts
  - app/components/encounter/AoOPrompt.vue
  - app/stores/encounter.ts
  - app/server/routes/ws.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/services/encounter.service.ts
  - artifacts/designs/design-priority-interrupt-001/_index.md
  - artifacts/tickets/open/feature/feature-016.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 4
reviewed_at: 2026-03-01T14:30:00Z
follows_up: null
---

## Review Scope

First review of feature-016 (Priority/Interrupt/Attack of Opportunity System) P0 implementation. 9 commits spanning 16 files changed, ~1546 lines added. Covers AoO trigger detection engine, out-of-turn service, API endpoints, Prisma schema, VTT grid integration, WebSocket events, encounter store updates, and GM prompt UI component.

Verified against: spec-p0.md, shared-specs.md, PTU 1.05 p.241 (AoO rules), and applicable decrees (decree-003, decree-005, decree-006, decree-033, decree-038, decree-039).

## Decree Compliance

- **decree-003** (token passability): AoO adjacency checks use grid positions, not token blocking. Movement through tokens is allowed. Compliant.
- **decree-005** (status CS auto-apply): Not directly relevant to AoO P0, but the faint handling in `aoo-resolve.post.ts` correctly calls `applyFaintStatus` which handles decree-005 CS reversal. Compliant.
- **decree-006** (dynamic initiative reorder): Not impacted by P0 (AoO does not change initiative). Compliant.
- **decree-038** (Sleep classification): `AOO_BLOCKING_CONDITIONS` includes `'Asleep'` and `'Bad Sleep'`, matching the PTU text "Sleeping...targets." Per decree-038, Sleep is volatile but the blocking check is condition-name-based, not category-based. Compliant.

No new ambiguities discovered requiring decree-need tickets.

## Issues

### CRITICAL

#### CRIT-001: `autoDeclineFaintedReactor` is defined but never called -- stale AoO prompts for fainted reactors

**File:** `app/server/services/out-of-turn.service.ts` (line 302)

The function `autoDeclineFaintedReactor(pendingActions, faintedCombatantId)` is exported but never invoked anywhere in the codebase. Per spec Section H3: "If a reactor faints between trigger detection and resolution (e.g., from another effect), the pending action is auto-declined."

Currently, if a combatant gets a pending AoO prompt and then faints (via tick damage, heavily injured penalty, or another AoO's Struggle Attack), the GM will still see the "Accept AoO" button for the now-fainted combatant. Accepting would attempt to execute a Struggle Attack from a fainted combatant. The `canUseAoO` check in the service would catch HP <= 0, but `canUseAoO` is only called during **detection**, not during **resolution**. The `aoo-resolve.post.ts` endpoint does not re-validate reactor eligibility before executing the Struggle Attack.

**Impact:** A fainted combatant could execute an AoO Struggle Attack if the GM clicks "Accept" after the reactor has fainted from another source. This is a correctness bug.

**Fix required:** Either:
1. Wire up `autoDeclineFaintedReactor` in every code path that causes fainting (damage endpoint, tick damage, heavily injured penalty, AoO resolve itself), OR
2. Add a re-validation check in `aoo-resolve.post.ts` before executing the Struggle Attack: verify the reactor's HP > 0 and is not in a blocking condition. This is simpler and more defensive.

Option 2 is recommended. Add before the damage application block in `aoo-resolve.post.ts`:

```typescript
// Re-validate reactor eligibility (H3: reactor may have fainted since detection)
const reactor = updatedCombatants.find(c => c.id === action.actorId)
if (!reactor || reactor.entity.currentHp <= 0) {
  // Auto-decline: reactor is no longer eligible
  // ... mark action as declined instead
}
```

---

### HIGH

#### HIGH-001: `triggerType` input not validated against AoO trigger enum in detect endpoint

**File:** `app/server/api/encounters/[id]/aoo-detect.post.ts` (lines 38-52)

The `triggerType` parameter is cast to `AoOTrigger` via `as` assertion but never validated against the valid set of values (`'shift_away' | 'ranged_attack' | 'stand_up' | 'maneuver_other' | 'retrieve_item'`). A malformed request with `triggerType: "invalid"` passes the `!triggerType` check and reaches `detectAoOTriggers`, where `AOO_TRIGGER_MAP[triggerType]` returns `undefined`. This causes a runtime crash at `triggerInfo.description` (TypeError: Cannot read properties of undefined).

**Fix required:** Add validation after the existence check:

```typescript
const validTriggers: AoOTrigger[] = ['shift_away', 'ranged_attack', 'stand_up', 'maneuver_other', 'retrieve_item']
if (!validTriggers.includes(triggerType)) {
  throw createError({
    statusCode: 400,
    message: `Invalid triggerType: ${triggerType}`
  })
}
```

Or use the `AOO_TRIGGER_MAP` keys: `if (!(triggerType in AOO_TRIGGER_MAP))`.

#### HIGH-002: `AOO_STRUGGLE_ATTACK_DAMAGE_BASE` constant has incorrect value

**File:** `app/constants/aooTriggers.ts` (lines 64-69)

The constant is set to `10` with comment "1d8+6 (Physical, Typeless, Melee). In set damage mode, average = 10." However, the PTU Damage Base chart in `useDamageCalculation.ts` shows DB4 = `{rolled: '1d8+6', set: [7, 11, 14]}`. The average set damage for DB4 is **11**, not 10.

While this constant is currently unused (the GM provides damage manually), it will mislead any future P1/P2 code that auto-calculates Struggle Attack damage. The comment and value are both wrong.

**Fix required:** Change to `export const AOO_STRUGGLE_ATTACK_DAMAGE_BASE = 11` and update comment to: "PTU: DB4 = 1d8+6 rolled / [7, 11, 14] set. In set damage mode, average = 11."

#### HIGH-003: `app-surface.md` not updated with new endpoints, components, and service

**File:** `.claude/skills/references/app-surface.md`

Two new API endpoints (`POST /api/encounters/:id/aoo-detect`, `POST /api/encounters/:id/aoo-resolve`), one new component (`AoOPrompt.vue`), one new service (`out-of-turn.service.ts`), one new utility (`adjacency.ts`), and one new constants file (`aooTriggers.ts`) were added without updating the app surface reference document. Per review checklist: "If new endpoints/components/routes/stores: was `app-surface.md` updated?"

**Fix required:** Add entries for:
- Endpoints: `aoo-detect.post.ts`, `aoo-resolve.post.ts`
- Component: `AoOPrompt.vue` (in encounter components section)
- Service: `out-of-turn.service.ts`
- Utility: `adjacency.ts`
- Constants: `aooTriggers.ts`
- Store additions: `detectAoO`, `resolveAoO` actions; `pendingAoOs`, `pendingOutOfTurnActions`, `hasAoOPrompts` getters
- WebSocket events: `aoo_triggered`, `aoo_resolved`

---

### MEDIUM

#### MED-001: Client-side AoO preview (`getAoOTriggersForMove`) does not check reactor eligibility

**File:** `app/composables/useGridMovement.ts` (lines 570-604)

The function returns all adjacent enemy IDs who were adjacent before but not after a move, without checking if those enemies are sleeping, paralyzed, flinched, or have already used their AoO this round. This means the movement preview may show AoO warning indicators on enemies who are actually ineligible.

Per the spec (Section C2): "Adjacent enemies who would get an AoO are highlighted with a warning indicator." A Sleeping enemy doesn't "get an AoO" -- the server would reject it.

The comment says "This is a CLIENT-SIDE preview" and the server is authoritative, which is good. But false positives in the UI reduce GM trust in the indicator.

**Fix required:** Add basic eligibility filtering in the client-side function. At minimum, filter out combatants with HP <= 0 and those with blocking conditions (`Asleep`, `Bad Sleep`, `Flinched`, `Paralyzed`):

```typescript
if (other.entity.currentHp <= 0) continue
const conditions = other.entity.statusConditions ?? []
if (conditions.some(c => ['Asleep', 'Bad Sleep', 'Flinched', 'Paralyzed'].includes(c))) continue
```

#### MED-002: `aoo-resolve.post.ts` does not auto-decline pending AoOs for the trigger target when they faint from the Struggle Attack

**File:** `app/server/api/encounters/[id]/aoo-resolve.post.ts` (lines 105-162)

When the trigger target faints from an accepted AoO Struggle Attack, any OTHER pending AoO actions where that target is the `triggerId` (i.e., they triggered additional AoOs) should not be affected -- those are fine. But any pending AoO actions where the fainted combatant is the `actorId` (reactor) should be auto-declined. The current code does not do this.

This is related to CRIT-001 but specifically concerns the case where the AoO Struggle Attack itself causes a different reactor to faint (unlikely but possible if the target of the AoO also happened to be a pending reactor for a different AoO).

**Fix required:** After the damage block, if `damageResult.fainted`, call `autoDeclineFaintedReactor` on the `updatedActions` for the trigger combatant's ID. Also check if the trigger target had any pending AoO actions as a reactor and decline those too.

#### MED-003: `aoo-detect.post.ts` response uses stale `record` for `buildEncounterResponse`

**File:** `app/server/api/encounters/[id]/aoo-detect.post.ts` (line 120)

The call `buildEncounterResponse(record, combatants, { pendingOutOfTurnActions: allPending })` passes the pre-update `record`. While the `pendingOutOfTurnActions` override ensures the correct pending actions are returned, any other field that changed between the `loadEncounter` and the `prisma.encounter.update` would be stale.

In the current implementation, only `pendingActions` is written, and it's overridden, so this is functionally correct today. But it's a fragile pattern -- future changes to the detect endpoint that write additional fields would silently use stale data in the response.

**Fix required:** Either re-read the record after update:
```typescript
const updatedRecord = await prisma.encounter.update({ where: { id }, data: { pendingActions: JSON.stringify(allPending) } })
const response = buildEncounterResponse(updatedRecord, combatants, { pendingOutOfTurnActions: allPending })
```
Or document the dependency explicitly with a comment.

#### MED-004: Pending AoO actions accumulate indefinitely -- no cleanup of resolved/declined/expired actions

**Files:** `app/server/api/encounters/[id]/aoo-detect.post.ts`, `app/server/api/encounters/[id]/aoo-resolve.post.ts`, `app/server/api/encounters/[id]/next-turn.post.ts`

The `pendingActions` JSON column accumulates all OutOfTurnAction records. The detect endpoint appends new actions (line 99), the resolve endpoint updates status but does not remove completed actions, and the round-reset only marks them as `expired` but never removes them. Over a long encounter with many AoO triggers, this JSON blob will grow indefinitely with resolved/declined/expired entries.

The store getters filter by `status === 'pending'`, so the UI is unaffected. But the JSON blob transmitted over WebSocket and stored in the DB grows without bound.

**Fix required:** In `expirePendingActions` or at round-start, strip out non-pending actions:
```typescript
// Remove resolved/declined/expired actions at round start
const cleanedActions = pendingActions.filter(a => a.status === 'pending')
```

Or add cleanup to `aoo-resolve.post.ts` after resolution -- remove actions that are no longer pending.

---

## What Looks Good

1. **Type system design is clean and extensible.** The `OutOfTurnAction`, `OutOfTurnUsage`, `AoOTrigger`, and `OutOfTurnCategory` types in `combat.ts` are well-structured for P1/P2 extension (Priority, Interrupt, Hold). The `triggerContext` optional field for future Intercept data is forward-thinking.

2. **Adjacency utilities are well-engineered.** `app/utils/adjacency.ts` correctly handles multi-cell tokens (NxN), uses efficient Set-based lookups, and has clear function signatures. The `wasAdjacentBeforeMove` function correctly implements the "was adjacent before AND not adjacent after" logic.

3. **Service layer follows SRP.** The `out-of-turn.service.ts` contains pure business logic (detection, eligibility, resolution) while the API endpoints handle HTTP concerns and DB operations. The `resolveAoOAction` function uses immutable patterns (returning new arrays via `.map()`).

4. **Round reset integration is correct.** `resetCombatantsForNewRound` in `next-turn.post.ts` properly resets `outOfTurnUsage` and `disengaged` for all combatants. The `expirePendingActions` call at round boundaries prevents stale prompts from the previous round.

5. **PTU rule accuracy.** All five AoO trigger types from PTU p.241 are correctly implemented: shift_away, ranged_attack, stand_up, maneuver_other, retrieve_item. The `AOO_BLOCKING_CONDITIONS` correctly includes Asleep, Bad Sleep, Flinched, and Paralyzed per PTU text. The Disengage exemption is properly handled. Per decree-003, adjacency uses positions rather than blocking checks.

6. **WebSocket integration is consistent.** The `aoo_triggered` and `aoo_resolved` events follow the existing broadcast pattern. The `sendEncounterState` function in `ws.ts` correctly maps `pendingActions` to `pendingOutOfTurnActions`. The encounter store's `updateFromWebSocket` handles the new fields.

7. **AoOPrompt component is well-structured.** BEM naming, props/emits boundary (no store access in the component), proper damage input flow with confirm/cancel. Uses Phosphor icons as SVGs per project convention.

8. **Backward compatibility is maintained.** All new fields are optional with defaults. `pendingActions` and `holdQueue` Prisma columns default to `"[]"`. The `buildEncounterResponse` function parses missing fields gracefully.

9. **Commit granularity is good.** 9 commits for this feature (types -> constants -> utilities -> service -> endpoints -> integration -> UI -> WS fix -> docs). Each commit is focused and produces a working state.

## Verdict

**CHANGES_REQUIRED**

The implementation is architecturally sound and follows PTU rules correctly for the happy path. However, CRIT-001 (fainted reactor can still execute AoO) is a correctness bug that must be fixed before merge. The three HIGH issues (input validation crash, incorrect constant, missing app-surface update) should also be addressed. The four MEDIUM issues are real problems that should be fixed now while the developer is in the code.

## Required Changes

1. **CRIT-001:** Add reactor eligibility re-validation in `aoo-resolve.post.ts` before executing the Struggle Attack. If the reactor's HP <= 0 or they have a blocking condition, auto-decline instead of executing.
2. **HIGH-001:** Validate `triggerType` against `AOO_TRIGGER_MAP` keys in `aoo-detect.post.ts`.
3. **HIGH-002:** Fix `AOO_STRUGGLE_ATTACK_DAMAGE_BASE` from 10 to 11 and correct the comment.
4. **HIGH-003:** Update `app-surface.md` with all new endpoints, components, service, utility, constants, store additions, and WebSocket events.
5. **MED-001:** Add basic eligibility filtering (HP > 0, no blocking conditions) to `getAoOTriggersForMove` client-side preview.
6. **MED-002:** Auto-decline pending AoO actions for reactors who faint during AoO resolution.
7. **MED-003:** Use the return value of `prisma.encounter.update` for `buildEncounterResponse` in `aoo-detect.post.ts`.
8. **MED-004:** Strip resolved/declined/expired actions from `pendingActions` at round boundaries or during resolution.
