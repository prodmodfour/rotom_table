---
cap_id: player-view-C030
name: player-view-C030
type: —
domain: player-view
---

### player-view-C030
- **name:** PlayerCombatActions component
- **type:** component
- **location:** `app/components/player/PlayerCombatActions.vue`
- **game_concept:** Player combat action panel (turn-based)
- **description:** Full combat action interface shown when it is the player's turn. Includes: turn state banner (STD/SHF/SWF action pips), league battle phase indicator, cannot-command warning, move buttons with type/DB/AC/frequency, target selection overlay, core actions (Shift, Struggle, Pass Turn), request actions requiring GM approval (Use Item, Switch Pokemon, Maneuver), expandable panels for items/switch/maneuvers, pass turn confirmation dialog, move detail overlay (long-press/right-click), and toast notifications for action results.
- **inputs:** Uses usePlayerCombat() composable for all combat state and actions
- **outputs:** Sends combat actions through encounterStore and WebSocket
- **accessible_from:** player
