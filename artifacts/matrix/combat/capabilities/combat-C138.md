---
cap_id: combat-C138
name: BreatherShiftBanner
type: component
domain: combat
---

### combat-C138: BreatherShiftBanner
- **cap_id**: combat-C138
- **name**: Breather Shift Reminder
- **type**: component
- **location**: `app/components/encounter/BreatherShiftBanner.vue`
- **game_concept**: Take a Breather shift requirement
- **description**: Banner reminding shift-away-from-enemies requirement.
- **inputs**: Temp conditions
- **outputs**: Display only
- **accessible_from**: gm

### combat-C139-C144: Combat Display Components
- **cap_id**: combat-C139
- **name**: Combat Display Components
- **type**: component
- **location**: `app/components/encounter/CombatantConditionsSection.vue`, `MoveButton.vue`, `MoveInfoCard.vue`, `TargetSelector.vue`, `TargetDamageList.vue`, `CaptureRateDisplay.vue`
- **game_concept**: Combat UI elements
- **description**: CombatantConditionsSection (status badges), MoveButton (move with frequency), MoveInfoCard (move details), TargetSelector (range/LoS targets), TargetDamageList (per-target damage), CaptureRateDisplay (capture rate in encounter).
- **inputs**: Respective data
- **outputs**: Display + selections
- **accessible_from**: gm (most), player (MoveButton, MoveInfoCard)

### combat-C145-C147: Player Combat Components
- **cap_id**: combat-C145
- **name**: Player Combat Components
- **type**: component
- **location**: `app/components/player/PlayerCombatActions.vue`, `PlayerEncounterView.vue`, `PlayerCombatantInfo.vue`
- **game_concept**: Player combat UI
- **description**: PlayerCombatActions (moves, shift, struggle, pass, requests), PlayerEncounterView (encounter display with combatants by side), PlayerCombatantInfo (visibility-aware HP).
- **inputs**: Player combat state
- **outputs**: Actions + display
- **accessible_from**: player

---

## WebSocket Event Capabilities
