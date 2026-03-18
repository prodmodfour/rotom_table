# Encounter Store Is Largest Hub Store

The `encounter` store is the largest in the codebase at ~724 lines, with 25+ getters and 40+ actions. It is the only store consumed by both the GM encounter page and the [[player-view-pokemon-moves|player view]], making it the central hub of runtime encounter state.

The action surface spans five subsystems, each [[encounter-store-delegates-via-build-context|delegated to a composable module]]: combat actions, undo/redo, switching, out-of-turn actions, and mounts. Despite this delegation, the store itself still defines all state, getters, and the `_buildContext()` wiring.

Getters cover combat state (round, turn, phase, battle type), combatant queries (by side, by initiative, by injury status), the move log, declarations, and two relational subsystems — mounting pairs and living weapon pairs — each with their own family of boolean checkers and lookup getters.

## See also

- [[encounter-store-between-turns-gates-priority]] — the `betweenTurns` flag that gates priority declarations
- [[encounter-store-merges-websocket-updates-surgically]] — how incoming WebSocket data is merged
- [[encounter-xp-store-extracted-to-limit-file-size]] — the XP actions were split out to keep this store manageable
- [[stateless-service-stores-wrap-api-calls]] — encounterGrid and encounterCombat are satellite stores that namespace related API calls
- [[stores-instantiate-lazily-per-page]] — the encounter store is instantiated on GM encounter, GM map, GM encounter tables, group view, and player view routes