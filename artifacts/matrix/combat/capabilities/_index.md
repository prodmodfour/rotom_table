---
domain: combat
type: capabilities
total_capabilities: 102
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
---

# Capabilities: combat

# App Capabilities: Combat

> Re-mapped: 2026-02-26. Covers Equipment P0+P1+P2 (DR, shields, evasion, Focus bonuses, HumanEquipmentTab, catalog browser), Focus stat bonuses for initiative+evasion, helmet DR fix, league battle modes, XP system, weather duration, move frequency, all combat mechanics.

---

## Prisma Model Capabilities

## Capability Listing

| Cap ID | Name | Type |
|--------|------|------|
| combat-C001 | Encounter Model | prisma-model |
| combat-C002 | HumanCharacter Equipment Field | prisma-field |
| combat-C003 | Encounter Weather Fields | prisma-field |
| combat-C004 | Encounter League Battle Fields | prisma-field |
| combat-C005 | Encounter XP Tracking Fields | prisma-field |
| combat-C010 | Create Encounter | api-endpoint |
| combat-C011 | List Encounters | api-endpoint |
| combat-C012 | Get Encounter | api-endpoint |
| combat-C013 | Update Encounter | api-endpoint |
| combat-C014 | Create Encounter from Scene | api-endpoint |
| combat-C015 | Start Encounter | api-endpoint |
| combat-C016 | End Encounter | api-endpoint |
| combat-C017 | Next Turn | api-endpoint |
| combat-C018 | Add Combatant | api-endpoint |
| combat-C019 | Remove Combatant | api-endpoint |
| combat-C020 | Apply Damage | api-endpoint |
| combat-C021 | Heal Combatant | api-endpoint |
| combat-C022 | Execute Move | api-endpoint |
| combat-C023 | Modify Combat Stages | api-endpoint |
| combat-C024 | Update Status Conditions | api-endpoint |
| combat-C025 | Take a Breather | api-endpoint |
| combat-C026 | Sprint Action | api-endpoint |
| combat-C027 | Pass Turn | api-endpoint |
| combat-C028 | Calculate Damage (Read-Only) | api-endpoint |
| combat-C029 | Set Weather | api-endpoint |
| combat-C030 | Serve Encounter | api-endpoint |
| combat-C031 | Unserve Encounter | api-endpoint |
| combat-C032 | Get Served Encounter | api-endpoint |
| combat-C033 | Wild Pokemon Spawn | api-endpoint |
| combat-C034 | Set Significance | api-endpoint |
| combat-C035 | Calculate XP Preview | api-endpoint |
| combat-C036 | Distribute XP | api-endpoint |
| combat-C037 | Get Character Equipment | api-endpoint |
| combat-C038 | Update Character Equipment | api-endpoint |
| combat-C039 | Update Grid Position | api-endpoint |
| combat-C040 | Update Grid Config | api-endpoint |
| combat-C041 | Manage Grid Background | api-endpoint |
| combat-C042 | Get/Set Fog of War | api-endpoint |
| combat-C043 | Get/Set Terrain | api-endpoint |
| combat-C044 | Next Scene | api-endpoint |
| combat-C050 | calculateDamage (Combatant Service) | service-function |
| combat-C051 | applyDamageToEntity | service-function |
| combat-C052 | applyHealingToEntity | service-function |
| combat-C053 | updateStatusConditions | service-function |
| combat-C054 | updateStageModifiers | service-function |
| combat-C055 | buildCombatantFromEntity | service-function |
| combat-C056 | buildPokemonEntityFromRecord | service-function |
| combat-C057 | buildHumanEntityFromRecord | service-function |
| combat-C058 | countMarkersCrossed | service-function |
| combat-C060 | calculateDamage (9-Step) | utility |
| combat-C061 | calculateEvasion | utility |
| combat-C062 | calculateAccuracyThreshold | utility |
| combat-C063 | applyStageModifier | utility |
| combat-C064 | applyStageModifierWithBonus | utility |
| combat-C065 | computeEquipmentBonuses | utility |
| combat-C066 | checkMoveFrequency | utility |
| combat-C067 | incrementMoveUsage | utility |
| combat-C068 | resetSceneUsage | utility |
| combat-C069 | resetDailyUsage | utility |
| combat-C070 | calculateEncounterBudget | utility |
| combat-C071 | analyzeEncounterBudget | utility |
| combat-C072 | calculateEncounterXp | utility |
| combat-C080 | COMBAT_MANEUVERS | constant |
| combat-C081 | EQUIPMENT_CATALOG | constant |
| combat-C082 | STATUS_CONDITIONS | constant |
| combat-C083 | SIGNIFICANCE_PRESETS | constant |
| combat-C084 | DAMAGE_BASE_CHART | constant |
| combat-C085 | STAGE_MULTIPLIERS | constant |
| combat-C090 | useCombat | composable-function |
| combat-C091 | useMoveCalculation | composable-function |
| combat-C092 | usePlayerCombat | composable-function |
| combat-C093 | useEncounterBudget | composable-function |
| combat-C100 | encounter store — loadEncounter | store-action |
| combat-C101 | encounter store — createEncounter | store-action |
| combat-C102 | encounter store — createFromScene | store-action |
| combat-C109 | encounter store — undo/redo | store-action |
| combat-C110 | encounter store — serve/unserve | store-action |
| combat-C111 | encounter store — setWeather | store-action |
| combat-C112 | encounter store — addWildPokemon | store-action |
| combat-C115 | encounter store — getters | store-getter |
| combat-C116 | encounter store — updateFromWebSocket | store-action |
| combat-C117 | encounterCombat store | store-action |
| combat-C120 | CombatantCard | component |
| combat-C121 | GroupCombatantCard | component |
| combat-C122 | PlayerCombatantCard | component |
| combat-C123 | MoveTargetModal | component |
| combat-C124 | GMActionModal | component |
| combat-C125 | ManeuverGrid | component |
| combat-C130 | AddCombatantModal | component |
| combat-C136 | HumanEquipmentTab | component |
| combat-C137 | EquipmentCatalogBrowser | component |
| combat-C138 | BreatherShiftBanner | component |
| combat-C150 | encounter_update | websocket-event |
| combat-C151 | turn_change | websocket-event |
| combat-C152 | damage_applied / heal_applied | websocket-event |
| combat-C153 | status_change / move_executed | websocket-event |
| combat-C154 | combatant_added / combatant_removed | websocket-event |
| combat-C155 | serve_encounter / encounter_unserved | websocket-event |
| combat-C156 | player_action / player_action_ack | websocket-event |
| combat-C157 | player_turn_notify | websocket-event |
| combat-C158 | movement_preview | websocket-event |
| combat-C159 | player_move_request / player_move_response | websocket-event |
