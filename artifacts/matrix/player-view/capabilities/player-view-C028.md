---
cap_id: player-view-C028
name: player-view-C028
type: —
domain: player-view
---

### player-view-C028
- **name:** PlayerCombatantInfo component
- **type:** component
- **location:** `app/components/player/PlayerCombatantInfo.vue`
- **game_concept:** Combatant info card with information asymmetry
- **description:** Displays a combatant (trainer or Pokemon) with visibility rules based on ownership. Own combatants: exact HP, stats, moves, abilities, injuries. Allied combatants: exact HP, injuries (no stats/moves). Enemy combatants: percentage HP only (no exact values, no injuries). Shows sprite for Pokemon, avatar initial for trainers. Displays current turn badge, types, status conditions. Visual states for current turn (scarlet border), own (teal border), and fainted (dimmed).
- **inputs:** combatant: Combatant, isCurrentTurn, myCharacterId, myPokemonIds
- **outputs:** Visual display with information asymmetry applied
- **accessible_from:** player
