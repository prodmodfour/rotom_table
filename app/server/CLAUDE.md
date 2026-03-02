# Server CLAUDE.md

Context for working within the Nitro server (`app/server/`).

## Real-time Sync

WebSocket (`/ws`) handles GM-to-Group synchronization with role-based broadcasting.

### Client → Server
- `identify` — client identifies as gm/group/player
- `join_encounter` / `leave_encounter` — encounter room management
- `sync_request` / `tab_sync_request` — request state sync

### Broadcast Events (relayed by server)
- **Combat**: `turn_change`, `damage_applied`, `heal_applied`, `status_change`, `move_executed`, `combatant_added`, `combatant_removed`
- **Encounter**: `encounter_update`, `serve_encounter`, `encounter_unserved`
- **VTT**: `movement_preview`
- **Scene**: `scene_update`
- **Player**: `player_action` (group → GM only)
- **Entity**: `character_update` (broadcast to all)
