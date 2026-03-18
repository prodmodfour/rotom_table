# Encounter Store Decomposition

The encounter store (`stores/encounter.ts`) delegates to 5 composables via a `_buildContext()` pattern:

| Delegate Composable | Responsibility |
|---|---|
| `useEncounterCombatActions` | Turn/damage/heal/items |
| `useEncounterUndoRedo` | Snapshot/undo/redo (see [[undo-redo-system]]) |
| `useEncounterSwitching` | Switch/recall/release |
| `useEncounterOutOfTurn` | AoO/hold/priority/interrupt/intercept/disengage |
| `useEncounterMounts` | Mount/dismount/rider features |

Out-of-turn getters (`pendingAoOs`, `holdQueue`, `isBetweenTurns`, etc.) are further extracted to `useOutOfTurnState`, used by components directly.

CRUD, serve/unserve, websocket, weather, wild spawn, significance, vision, and environment preset remain inline in the store.

## See also

- [[pinia-store-classification]]
- [[composable-domain-grouping]]
- [[encounter-store-as-facade]] — how the delegation pattern relates to the facade pattern
- [[encounter-store-god-object-risk]] — the external coupling cost of the facade approach
