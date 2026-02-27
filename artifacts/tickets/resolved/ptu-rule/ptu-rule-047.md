---
ticket_id: ptu-rule-047
priority: P2
status: resolved
domain: combat
matrix_source:
  rule_ids:
    - combat-R092
    - combat-R098
  audit_file: matrix/combat-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Condition clearing on state transitions is too aggressive or absent: (1) Fainting clears ALL conditions including "Other" type, but PTU only clears Persistent and Volatile. (2) Ending an encounter does not automatically clear volatile conditions from combatants.

## Expected Behavior (PTU Rules)

- Faint: clears Persistent and Volatile conditions only, not "Other" conditions
- Encounter end: all Volatile conditions should be cleared automatically

## Actual Behavior

Faint clears everything. Encounter end clears nothing.

## Resolution Log

### 2026-02-20 — Implementation

**Root cause (Issue 1 — faint):** `applyDamageToEntity()` in `combatant.service.ts` used `entity.statusConditions = ['Fainted']`, replacing all conditions with just Fainted. PTU p.248 says "cured of all Persistent and Volatile Status Conditions" — not Other conditions.

**Fix (Issue 1):** Changed faint handler to filter out only Persistent and Volatile conditions, preserving Other conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable). Uses `PERSISTENT_CONDITIONS` and `VOLATILE_CONDITIONS` from `constants/statusConditions.ts`.

**Root cause (Issue 2 — encounter end):** `end.post.ts` simply set `isActive: false` without touching combatant status conditions. PTU p.247: "Volatile Afflictions are cured completely at the end of the encounter."

**Fix (Issue 2):** Updated `end.post.ts` to iterate all combatants, remove Volatile conditions (Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed) from each entity's statusConditions, save updated combatants to the encounter record, and sync changes to the database for entities with records.

**PTU verification:**
- p.247: "Volatile Afflictions are cured completely at the end of the encounter, and from Pokemon by recalling them into their Poke Balls. When Pokemon are Fainted, they are automatically cured of all Volatile Status Afflictions."
- p.248: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."
- p.248: "Other Afflictions... do not count as true 'Status Afflictions'. Moves, items, features, and other effects that heal Status Afflictions cannot fix these effects."

**Duplicate path check:**
- Faint handling: Only in `combatant.service.ts:applyDamageToEntity()`. `move.post.ts` delegates to `applyDamageToEntity`. No other inline faint paths found.
- Encounter ending: Only in `end.post.ts`. Client-side `encounterStore.endEncounter()` calls this endpoint and reflects the response.
- Breather endpoint already uses `VOLATILE_CONDITIONS` correctly — no changes needed.
- Extended rest correctly uses `PERSISTENT_CONDITIONS` — no changes needed.
