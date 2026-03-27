# WebSocket Real-Time Sync

The WebSocket system handles role-based broadcasting across the [[triple-view-system]].

## Client-to-Server Events

- `identify` — Client identifies as gm/group/player
- `join_encounter` / `leave_encounter` — Encounter room management
- `sync_request` / `tab_sync_request` — Request state sync

## Broadcast Events (relayed by server)

**Combat:** `turn_change`, `damage_applied`, `heal_applied`, `status_change`, `move_executed`, `combatant_added`, `combatant_removed`, `mount_change`, `living_weapon_engage`, `living_weapon_disengage`

**Encounter:** `encounter_update`, `serve_encounter`, `encounter_unserved`

**VTT:** `movement_preview`

**Scene:** entity changes, activation broadcasts, player sync

**Player:** `player_action` (group to GM only)

**Entity:** `character_update` (broadcast to all)

The full event set uses a discriminated union on the `type` field, enabling type-safe handling via the [[observer-pattern]].

## See also

- [[observer-pattern]] — the WebSocket broadcast system follows this pattern: the server publishes events to subscribed clients
- [[encounter-serving-mechanics]] — serve/unserve events manage group/player display
- [[combatant-card-visibility-rules]] — how event data is filtered per audience
- [[triple-view-system]]
