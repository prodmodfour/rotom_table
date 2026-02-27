---
cap_id: healing-C039
name: Composable -- handleHeal()
type: —
domain: healing
---

## healing-C039: Composable -- handleHeal()

- **Type:** composable-function
- **Location:** `composables/useEncounterActions.ts:handleHeal`
- **Game Concept:** Orchestrates in-combat healing with undo/redo support
- **Description:** Captures undo snapshot with descriptive label (e.g. "Healed X (5 HP, 1 injury)"), calls `encounterStore.healCombatant()`, refreshes undo/redo state, and broadcasts the update via WebSocket.
- **Inputs:** `combatantId, amount, tempHp?, healInjuries?`
- **Outputs:** Side effects: encounter state updated, snapshot captured, broadcast sent
- **Accessible From:** `gm`
- **Orphan:** false
