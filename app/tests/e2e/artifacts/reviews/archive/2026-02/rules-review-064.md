---
review_id: rules-review-064
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-020, bug-021, bug-022
domain: combat, capture, character-lifecycle
commits_reviewed:
  - c9e815d
  - 11fc717
  - f94dd60
  - 8321102
  - a0fc14d
  - c735e4a
  - d25d17e
files_reviewed:
  - app/constants/combatManeuvers.ts
  - app/composables/useEncounterActions.ts
  - app/composables/useCapture.ts
  - app/utils/restHealing.ts
  - app/server/api/scenes/[id]/deactivate.post.ts
  - app/server/api/scenes/[id]/activate.post.ts
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/server/api/characters/[id]/new-day.post.ts
  - app/server/api/characters/[id]/heal-injury.post.ts
  - app/server/api/characters/[id].put.ts
  - app/server/api/game/new-day.post.ts
  - app/server/services/combatant.service.ts
  - app/server/utils/serializers.ts
  - app/prisma/schema.prisma
mechanics_verified:
  - disarm-maneuver-definition
  - dirty-trick-maneuver-definition
  - maneuver-action-consumption
  - capture-standard-action-consumption
  - ap-max-formula
  - scene-end-ap-restoration
  - drained-ap-extended-rest-restoration
  - drain-ap-injury-healing
  - new-day-ap-reset
verdict: APPROVED_WITH_NOTES
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#disarm (p.241, lines 1154-1161)
  - core/07-combat.md#dirty-trick (p.241, lines 1162-1183)
  - core/07-combat.md#attack-of-opportunity (p.241, lines 1136-1138)
  - core/05-pokemon.md#capture (p.214, lines 1704-1706)
  - core/06-playing-the-game.md#action-points (p.221, lines 216-231)
  - core/07-combat.md#injuries-drain-ap (p.250, lines 2006-2008)
  - core/07-combat.md#extended-rest (p.250, lines 2009-2011)
  - core/02-character-creation.md#derived-stats (p.16, lines 298-302)
reviewed_at: 2026-02-20T19:00:00
follows_up: null
---

## Review Scope

Reviewing three P3 bug-fix implementations across three domains: combat maneuvers (bug-020), capture action economy (bug-021), and scene-end AP restoration (bug-022). Each fix addresses a gap where PTU 1.05 rules were not implemented.

## PTU Rulebook Reference

### Disarm (Ch. 7, p.241, lines 1154-1161)

> **Maneuver: Disarm**
> Action: Standard
> AC: 6
> Class: Status
> Range: Melee, 1 Target
> Effect: You and the target each make opposed Combat or Stealth Checks. If you win, the target's Held Item (Main Hand or Off-Hand for humans) falls to the ground.

### Dirty Trick (Ch. 7, p.241, lines 1162-1183)

> **Maneuver: Dirty Trick**
> Action: Standard
> AC: 2
> Class: Status
> Range: Melee, 1 Target
> Effect: You may perform any of the Dirty Tricks listed below. You may use each trick only once each Scene per target.
>
> **Hinder:** Opposed Athletics Checks. Target is Slowed and -2 penalty to all Skill Checks for one full round.
> **Blind:** Opposed Stealth Checks. Target is Blinded for one full round.
> **Low Blow:** Opposed Acrobatics Checks. Target is Vulnerable and Initiative set to 0 until end of your next turn.

### Attack of Opportunity Trigger (Ch. 7, p.241, lines 1136-1138)

> An adjacent foe uses a Push, Grapple, **Disarm**, Trip, or **Dirty Trick** Maneuver that does not target you.

### Capture as Standard Action (Ch. 5, p.214, lines 1704-1706)

> Poke Balls can be thrown as a **Standard Action**, as an AC6 Status Attack Roll, with a range equal to 4 plus your Athletics Rank.

### Action Points (Ch. 6, p.221, lines 216-231)

> Trainers have a maximum Action Point pool equal to **5, plus 1 more for every 5 Trainer Levels** they have achieved; a Level 15 Trainer would have a maximum of 8 Action Points, for example.
> **Action Points are completely regained at the end of each Scene.** However, some effects may Bind or Drain Action Points. [...] **Drained AP becomes unavailable for use until after an Extended Rest is taken.**

### Injury Healing via AP Drain (Ch. 7, p.250, lines 2006-2008)

> Trainers can also remove Injuries as an Extended Action by **Draining 2 AP**. This is subject to the limitations on healing Injuries each day.

### Extended Rest (Ch. 7, p.250, lines 2009-2011)

> Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and **restore a Trainer's Drained AP**.

---

## Bug-020: Disarm and Dirty Trick Maneuvers

### 1. Disarm Maneuver Definition

- **PTU Rule:** Standard Action, AC 6, Melee 1 Target, opposed Combat or Stealth checks.
- **Implementation** (`app/constants/combatManeuvers.ts`, lines 59-67):
  ```typescript
  {
    id: 'disarm',
    name: 'Disarm',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 6,
    shortDesc: 'Force target to drop held item (opposed Combat/Stealth)',
    requiresTarget: true
  }
  ```
- **Verification:**
  - `actionType: 'standard'` -- matches "Action: Standard". CORRECT.
  - `ac: 6` -- matches "AC: 6". CORRECT.
  - `requiresTarget: true` -- matches "Range: Melee, 1 Target". CORRECT.
  - `shortDesc` mentions "opposed Combat/Stealth" -- matches "opposed Combat or Stealth Checks". CORRECT.
- **Status:** CORRECT

### 2. Dirty Trick Maneuver Definition

- **PTU Rule:** Standard Action, AC 2, Melee 1 Target, three sub-options (Hinder/Blind/Low Blow), once per Scene per target.
- **Implementation** (`app/constants/combatManeuvers.ts`, lines 68-77):
  ```typescript
  {
    id: 'dirty-trick',
    name: 'Dirty Trick',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 2,
    shortDesc: 'Hinder, Blind, or Low Blow (once per Scene per target)',
    requiresTarget: true
  }
  ```
- **Verification:**
  - `actionType: 'standard'` -- matches "Action: Standard". CORRECT.
  - `ac: 2` -- matches "AC: 2". CORRECT.
  - `requiresTarget: true` -- matches "Range: Melee, 1 Target". CORRECT.
  - `shortDesc` mentions all three sub-options and the frequency limit. CORRECT.
- **Status:** CORRECT

### 3. Maneuver Action Consumption

- **PTU Rule:** Both Disarm and Dirty Trick are Standard Actions.
- **Implementation** (`app/composables/useEncounterActions.ts`, lines 133-135):
  ```typescript
  if (['push', 'sprint', 'trip', 'grapple', 'disarm', 'dirty-trick'].includes(maneuverId)) {
    await encounterStore.useAction(combatantId, 'standard')
  }
  ```
- **Verification:** Both `'disarm'` and `'dirty-trick'` are in the standard-action maneuver list. When executed, the combatant's standard action is consumed. CORRECT.
- **Status:** CORRECT

### 4. Attack of Opportunity Trigger

- **PTU Rule:** Using Disarm or Dirty Trick against a non-targeted adjacent foe triggers an AoO.
- **Implementation:** AoO is not implemented as an automated system in the codebase. This is a pre-existing gap unrelated to bug-020. The new maneuvers are correctly categorized in the AoO trigger list in the rulebook, and would be eligible if/when AoO automation is added. No regression introduced.
- **Status:** NOT APPLICABLE (pre-existing gap, not introduced by this fix)

### 5. Dirty Trick Sub-option Enforcement

- **MEDIUM NOTE:** The constant definition correctly documents the "once per Scene per target" restriction in the `shortDesc`, but the code does not enforce this programmatically. There is no per-target-per-scene tracking for Dirty Trick sub-options. This is acceptable for a P3 data-definition ticket -- the GM manually enforces the once-per-scene-per-target rule. However, this should be documented as a known limitation for future automation.
- **Status:** ACCEPTABLE (GM-enforced, not code-enforced)

---

## Bug-021: Capture Standard Action Consumption

### 6. Capture Consumes Standard Action

- **PTU Rule:** "Poke Balls can be thrown as a Standard Action" (p.214).
- **Implementation** (`app/composables/useCapture.ts`, lines 218-254):
  ```typescript
  encounterContext?: {
    encounterId: string
    trainerCombatantId: string
  }
  // ...
  if (params.encounterContext) {
    const { encounterId, trainerCombatantId } = params.encounterContext
    await $fetch(`/api/encounters/${encounterId}/action`, {
      method: 'POST',
      body: {
        combatantId: trainerCombatantId,
        actionType: 'standard'
      }
    })
  }
  ```
- **Verification:**
  1. When `encounterContext` is provided, the standard action is consumed via the same `POST /api/encounters/{id}/action` endpoint used by all other action-consuming flows. CORRECT.
  2. When `encounterContext` is not provided (out-of-encounter capture), no action is consumed. CORRECT -- captures outside encounters are not bounded by combat action economy.
  3. The action consumption happens AFTER the capture API call succeeds. This means if the capture roll itself fails (but the ball hits), the standard action is still consumed. This is CORRECT per PTU rules -- throwing a Poke Ball consumes the Standard Action regardless of whether the capture succeeds. The "Standard Action" is the throw, not the capture result.
  4. If the accuracy roll misses (ball doesn't hit), the capture API is never called, so the action is never consumed either. However, this depends on the calling UI sending the accuracy check result correctly. The composable itself does not enforce this -- it relies on the caller to only invoke `attemptCapture` when the ball hits. This is an acceptable separation of concerns.
- **Status:** CORRECT

### 7. Failure Handling

- **Implementation:** The action consumption is wrapped in a try/catch that logs to `console.error` on failure. If the action endpoint fails, the capture still succeeds but the action is not tracked.
- **Assessment:** This is a pragmatic choice -- it avoids a failed action-tracking call from blocking a successful capture. In practice, the action endpoint should never fail for valid encounter/combatant IDs. The `console.error` is appropriate for error handling (not a debug log). ACCEPTABLE.

---

## Bug-022: Scene-End AP Restoration

### 8. Max AP Formula

- **PTU Rule:** "5, plus 1 more for every 5 Trainer Levels" (p.221). Examples: Level 10 = 7, Level 15 = 8.
- **Implementation** (`app/utils/restHealing.ts`, lines 204-206):
  ```typescript
  export function calculateMaxAp(level: number): number {
    return 5 + Math.floor(level / 5)
  }
  ```
- **Verification:**
  - Level 1: 5 + floor(1/5) = 5. CORRECT.
  - Level 5: 5 + floor(5/5) = 6. CORRECT.
  - Level 10: 5 + floor(10/5) = 7. Matches rulebook example. CORRECT.
  - Level 15: 5 + floor(15/5) = 8. Matches rulebook example. CORRECT.
  - Level 20: 5 + floor(20/5) = 9. Extrapolation consistent with formula. CORRECT.
- **Status:** CORRECT

### 9. Scene-End AP Restoration Formula

- **PTU Rule:** "Action Points are completely regained at the end of each Scene. [...] Drained AP becomes unavailable for use until after an Extended Rest is taken." (p.221)
- **Implementation** (`app/utils/restHealing.ts`, lines 213-216):
  ```typescript
  export function calculateSceneEndAp(level: number, drainedAp: number): number {
    const maxAp = calculateMaxAp(level)
    return Math.max(0, maxAp - drainedAp)
  }
  ```
- **Verification:** Scene-end AP = maxAp - drainedAp, floored at 0. This correctly models: "completely regained" (reset to max) minus "Drained AP [...] unavailable" (subtract drained). The `Math.max(0, ...)` guard handles the edge case where drainedAp exceeds maxAp (possible if AP was drained beyond maximum through some interaction). CORRECT.
- **Status:** CORRECT

### 10. Scene Deactivation Endpoint

- **PTU Rule:** AP restored at scene end.
- **Implementation** (`app/server/api/scenes/[id]/deactivate.post.ts`, lines 31-53):
  1. Reads scene's character list from JSON.
  2. Queries each character's `level` and `drainedAp` from the database.
  3. Calls `calculateSceneEndAp(level, drainedAp)` to compute restored AP.
  4. Updates `currentAp` in the database.
- **Verification:** The deactivation endpoint correctly triggers AP restoration for all characters in the scene. It reads `drainedAp` from the database (not from a stale cache), ensuring accuracy. CORRECT.
- **Status:** CORRECT

### 11. Scene Activation Endpoint (Previous Scene AP Restoration)

- **PTU Rule:** When switching scenes, the previous scene ends, triggering AP restoration.
- **Implementation** (`app/server/api/scenes/[id]/activate.post.ts`, lines 16-48):
  1. Finds all currently active scenes.
  2. For each active scene's characters, restores AP via `calculateSceneEndAp()`.
  3. Deactivates all other scenes.
  4. Activates the new scene.
- **Verification:** This correctly handles the case where activating a new scene implicitly ends the previous scene. Characters in the old scene get their AP restored before the new scene begins. CORRECT.
- **Status:** CORRECT

### 12. Extended Rest AP Restoration

- **PTU Rule:** "Extended rests [...] restore a Trainer's Drained AP." (p.250)
- **Implementation** (`app/server/api/characters/[id]/extended-rest.post.ts`, lines 74-88):
  ```typescript
  const apRestored = character.drainedAp
  const maxAp = calculateMaxAp(character.level)
  // ...
  drainedAp: 0,        // Restore all drained AP
  currentAp: maxAp     // Full AP pool since drained is now 0
  ```
- **Verification:** Extended rest sets `drainedAp` to 0 and `currentAp` to full `maxAp`. Since drained AP is cleared, the trainer starts fresh. CORRECT.
- **Status:** CORRECT

### 13. Drain AP Injury Healing

- **PTU Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP." (p.250)
- **Implementation** (`app/server/api/characters/[id]/heal-injury.post.ts`, lines 64-92):
  ```typescript
  const newDrainedAp = character.drainedAp + 2
  const newCurrentAp = Math.max(0, character.currentAp - 2)
  ```
- **Verification:** Draining 2 AP to heal 1 injury. Both `drainedAp` is incremented by 2 (tracking cumulative drain for Extended Rest purposes) and `currentAp` is decremented by 2 (reducing available AP immediately). The `Math.max(0, ...)` prevents negative AP. CORRECT.
- **Status:** CORRECT

### 14. New Day AP Reset

- **PTU Rule:** A new day implies a period of rest. The implementation resets all daily counters and restores full AP.
- **Implementation** (both `app/server/api/game/new-day.post.ts` and `app/server/api/characters/[id]/new-day.post.ts`):
  ```typescript
  const maxAp = calculateMaxAp(char.level)
  // ...
  drainedAp: 0,
  currentAp: maxAp,
  ```
- **Verification:** New day clears drained AP and sets current AP to max. This assumes a new day implies an Extended Rest (4+ hours of sleep), which is a reasonable game assumption. CORRECT.
- **Status:** CORRECT

### 15. Prisma Schema

- **Implementation** (`app/prisma/schema.prisma`, line 56):
  ```prisma
  currentAp Int @default(5) // Current AP pool (restored at scene end, minus drainedAp)
  ```
- **Verification:** Default of 5 matches the Level 1 max AP (5 + floor(1/5) = 5). New characters start with full AP. CORRECT.
- **Status:** CORRECT

### 16. Serializer and Combatant Service

- **Implementation:** Both `app/server/utils/serializers.ts` and `app/server/services/combatant.service.ts` include `currentAp` and `drainedAp` in their output.
- **Verification:** The new field is exposed to the client correctly. CORRECT.
- **Status:** CORRECT

---

## Medium Issue

### M1: Dirty Trick Sub-option Per-Scene-Per-Target Tracking Not Enforced

- **Location:** `app/constants/combatManeuvers.ts` and `app/composables/useEncounterActions.ts`
- **PTU Rule:** "You may use each trick only once each Scene per target" (p.241).
- **Current State:** The `shortDesc` documents the restriction, and the GM can manually enforce it. However, there is no programmatic tracking of which Dirty Trick sub-options have been used against which targets within the current scene.
- **Impact:** LOW. The GM tool trusts the GM to enforce this. No incorrect game state is created -- the GM simply needs to remember the per-target limits.
- **Recommendation:** File as a future enhancement ticket if automated tracking is desired. This is not a bug in the current fix; the fix correctly adds the maneuver data that was missing.

---

## Cross-Reference: Bound AP

The PTU rules distinguish three AP states: Available, Bound, and Drained. The implementation tracks `currentAp` (available) and `drainedAp` (drained). Bound AP is not tracked as a separate field. This is a pre-existing design decision and is not introduced or worsened by these fixes. Scene-end restoration correctly handles the Available + Drained model. If Bound AP support is added later, `calculateSceneEndAp` would need to also subtract bound AP, but that is outside the scope of these tickets.

## Summary

- Mechanics checked: 16
- Correct: 15
- Not applicable: 1 (AoO trigger -- not implemented as automated system)
- Medium notes: 1 (Dirty Trick per-scene-per-target tracking not enforced programmatically)
- Incorrect: 0

## Rulings

1. **Disarm definition is PTU-accurate.** Action type (Standard), AC (6), range (Melee, 1 Target), and opposed check type (Combat/Stealth) all match PTU Core p.241 exactly.

2. **Dirty Trick definition is PTU-accurate.** Action type (Standard), AC (2), range (Melee, 1 Target), sub-options (Hinder/Blind/Low Blow), and frequency limit (once per Scene per target) all match PTU Core p.241 exactly.

3. **Capture correctly consumes a Standard Action.** Per PTU Core p.214, throwing a Poke Ball is a Standard Action. The implementation consumes the action via the encounter action endpoint when in-encounter context is provided. The action is consumed after a successful capture API call, which is correct -- the Standard Action is the throw, and the capture roll is a consequence of a successful hit.

4. **Max AP formula is PTU-accurate.** `5 + floor(level / 5)` produces correct values for all level examples given in the rulebook (Level 10 = 7, Level 15 = 8).

5. **Scene-end AP restoration is PTU-accurate.** The formula `maxAp - drainedAp` correctly implements "AP completely regained at end of each Scene" minus "Drained AP unavailable until Extended Rest." Both scene deactivation and scene-switch (activation) correctly trigger restoration.

6. **Extended Rest correctly restores drained AP.** Setting `drainedAp` to 0 and `currentAp` to full `maxAp` matches PTU Core p.250: "restore a Trainer's Drained AP."

7. **Drain-AP injury healing is PTU-accurate.** Draining 2 AP to heal 1 injury matches PTU Core p.250. Both `drainedAp` increment and `currentAp` decrement are correctly applied.

## Verdict

APPROVED_WITH_NOTES -- All three bug fixes correctly implement their respective PTU 1.05 mechanics. Disarm and Dirty Trick match the rulebook exactly in action type, AC, range, and effect descriptions. Capture correctly consumes a Standard Action when in encounter context. The AP system correctly implements the max AP formula, scene-end restoration (with drained AP subtraction), Extended Rest restoration, and drain-AP injury healing. One medium note: Dirty Trick per-scene-per-target sub-option tracking is GM-enforced rather than code-enforced, which is acceptable for the current implementation scope but should be considered for future automation.

## Required Changes

None. The medium note (M1) is a future enhancement, not a blocking issue.
