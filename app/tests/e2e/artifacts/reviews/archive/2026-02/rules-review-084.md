---
review_id: rules-review-084
target: ptu-rule-075
trigger: orchestrator-routed
reviewed_commits:
  - 4cb5198
verdict: PASS
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## Rules Review: ptu-rule-075 (Breather tempConditions push mutation)

### Scope

Single commit (`4cb5198`) replacing two `Array.push()` mutations with immutable spread assignments in `app/server/api/encounters/[id]/breather.post.ts`. This is a code style fix (immutability convention), not a logic change. The review verifies that game logic remains correct after the refactor.

### PTU Reference

**Source:** PTU 1.05, page 245 (from `books/markdown/core/07-combat.md`)

> Take a Breather... is a Full Action and requires a Pokemon or Trainer to use their Shift Action to move as far away from enemies as possible, using their highest available Movement Capability. They then become Tripped and are Vulnerable until the end of their next turn.
>
> When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions. To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters at the end of the Shift triggered by Take a Breather.

### Rule-to-Code Verification

| PTU Rule | Code Implementation | Status |
|----------|-------------------|--------|
| Full Action (Standard + Shift) | Lines 98-99: `turnState.standardActionUsed = true`, `turnState.hasActed = true` | CORRECT |
| Reset combat stages to default (0) | Lines 57-62: checks for non-zero stages, resets via `createDefaultStageModifiers()` | CORRECT |
| Lose all Temporary Hit Points | Lines 65-68: sets `entity.temporaryHp = 0` | CORRECT |
| Cure all Volatile status effects | Lines 19-23 + 70-82: uses `VOLATILE_CONDITIONS` (Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed) filtered to exclude Cursed, plus Slowed and Stuck | CORRECT |
| Cursed exception (GM adjudication) | Lines 16-18 + 20: Cursed excluded from auto-clearing with comment explaining why (app cannot track curse sources) | CORRECT |
| Slowed and Stuck also cured | Line 22: explicitly includes `'Slowed'` and `'Stuck'` in `BREATHER_CURED_CONDITIONS` | CORRECT |
| Apply Tripped (temporary) | Lines 88-91: applies Tripped to `combatant.tempConditions` if not already present | CORRECT |
| Apply Vulnerable (temporary) | Lines 92-95: applies Vulnerable to `combatant.tempConditions` if not already present | CORRECT |

### Commit Diff Analysis

The commit changes exactly two lines:

```diff
-      combatant.tempConditions.push('Tripped')
+      combatant.tempConditions = [...combatant.tempConditions, 'Tripped']
```

```diff
-      combatant.tempConditions.push('Vulnerable')
+      combatant.tempConditions = [...combatant.tempConditions, 'Vulnerable']
```

Both transformations are **behaviorally equivalent** on JSON-parsed objects. The `push()` call mutates the array in place and returns the new length; the spread assignment creates a new array with the same elements plus the appended value and reassigns the reference. Since `combatant` is a deserialized JSON object (not a reactive proxy or shared reference), the observable result is identical: `combatant.tempConditions` ends up containing the new condition, and the object is later serialized back to the database via `JSON.stringify(combatants)`.

No guard conditions, control flow, condition names, or any other logic was altered.

### VOLATILE_CONDITIONS Correctness

Cross-referenced against PTU 1.05 Volatile Status Afflictions:

| PTU Volatile Condition | In VOLATILE_CONDITIONS? |
|----------------------|------------------------|
| Asleep | Yes |
| Bad Sleep | Yes |
| Confused | Yes |
| Flinched | Yes |
| Infatuated | Yes |
| Cursed | Yes (excluded from Breather cure) |
| Disabled | Yes |
| Enraged | Yes |
| Suppressed | Yes |

All volatile conditions accounted for. Persistent conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) are correctly **not** cured by Take a Breather.

### Errata Check

Checked `books/markdown/errata-2.md` for any Take a Breather modifications. Found references in Paramedic feature (Rank 2 allows assisted Breather without Shift/Trip) and Bring It On! (grants temp HP on Breather). Neither affects the core Breather logic implemented here.

### Verdict

**PASS** -- The commit is a pure code style fix replacing `Array.push()` with immutable spread assignment. Game logic is unaltered. All PTU 1.05 Take a Breather rules (page 245) are correctly implemented: combat stage reset, temp HP removal, volatile + Slowed/Stuck cure, Cursed exception, and Tripped/Vulnerable application.
