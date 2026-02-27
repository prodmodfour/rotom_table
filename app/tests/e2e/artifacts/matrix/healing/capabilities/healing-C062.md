---
cap_id: healing-C062
name: Equipment Speed CS Override in Breather
type: —
domain: healing
---

## healing-C062: Equipment Speed CS Override in Breather

- **Type:** utility
- **Location:** `server/api/encounters/[id]/breather.post.ts` (Heavy Armor check) + `utils/equipmentBonuses.ts:computeEquipmentBonuses`
- **Game Concept:** Heavy Armor speed CS default for Take a Breather reset (PTU p.293)
- **Description:** When Take a Breather resets combat stages, Heavy Armor causes speed CS to reset to -1 instead of 0. The breather endpoint checks if the combatant is human, computes equipment bonuses via `computeEquipmentBonuses`, and applies `speedDefaultCS` to the default stage modifiers.
- **Inputs:** `combatant.entity.equipment`
- **Outputs:** Modified default stage modifiers with speed CS override
- **Accessible From:** `api-only`
- **Orphan:** false

---

## Capability Chains

### Chain 1: Character 30-Minute Rest
1. `healing-C040` (component: HealingTab -- handleRest) -> 2. `healing-C020` (composable: rest()) -> 3. `healing-C001` (api: characters/:id/rest) -> 4. `healing-C013` (utility: shouldResetDailyCounters) -> 5. `healing-C012` (utility: calculateRestHealing) -> 6. `healing-C052` (utility: getEffectiveMaxHp) -> 7. `healing-C048` (prisma: HumanCharacter update)
**Breaks at:** complete

### Chain 2: Pokemon 30-Minute Rest
1. `healing-C042` (component: Pokemon sheet healing tab) -> 2. `healing-C040` (component: HealingTab -- handleRest) -> 3. `healing-C020` (composable: rest()) -> 4. `healing-C006` (api: pokemon/:id/rest) -> 5. `healing-C013` (utility: shouldResetDailyCounters) -> 6. `healing-C012` (utility: calculateRestHealing) -> 7. `healing-C052` (utility: getEffectiveMaxHp) -> 8. `healing-C049` (prisma: Pokemon update)
**Breaks at:** complete

### Chain 3: Character Extended Rest
1. `healing-C040` (component: HealingTab -- handleExtendedRest) -> 2. `healing-C021` (composable: extendedRest()) -> 3. `healing-C002` (api: characters/:id/extended-rest) -> 4. `healing-C012` (utility: calculateRestHealing, 8x loop) -> 5. `healing-C017` (utility: getStatusesToClear) -> 6. `healing-C018` (utility: clearPersistentStatusConditions) -> 7. `healing-C054` (utility: calculateMaxAp) -> 8. `healing-C048` (prisma: update HP, status, drainedAp=0, boundAp=0, currentAp=maxAp)
**Breaks at:** complete

### Chain 4: Pokemon Extended Rest
1. `healing-C040` (component: HealingTab -- handleExtendedRest) -> 2. `healing-C021` (composable: extendedRest()) -> 3. `healing-C007` (api: pokemon/:id/extended-rest) -> 4. `healing-C012` (utility: calculateRestHealing, 8x loop) -> 5. `healing-C017` (utility: getStatusesToClear) -> 6. `healing-C018` (utility: clearPersistentStatusConditions) -> 7. `healing-C053` (utility: isDailyMoveRefreshable -- rolling window check) -> 8. `healing-C049` (prisma: update HP, status, moves)
**Breaks at:** complete

### Chain 5: Character Pokemon Center
1. `healing-C040` (component: HealingTab -- handlePokemonCenter) -> 2. `healing-C022` (composable: pokemonCenter()) -> 3. `healing-C003` (api: characters/:id/pokemon-center) -> 4. `healing-C015` (utility: calculatePokemonCenterTime) -> 5. `healing-C016` (utility: calculatePokemonCenterInjuryHealing) -> 6. `healing-C052` (utility: getEffectiveMaxHp) -> 7. `healing-C048` (prisma: full HP, clear status, heal injuries)
**Breaks at:** complete

### Chain 6: Pokemon Pokemon Center
1. `healing-C040` (component: HealingTab -- handlePokemonCenter) -> 2. `healing-C022` (composable: pokemonCenter()) -> 3. `healing-C008` (api: pokemon/:id/pokemon-center) -> 4. `healing-C015` (utility: calculatePokemonCenterTime) -> 5. `healing-C016` (utility: calculatePokemonCenterInjuryHealing) -> 6. `healing-C052` (utility: getEffectiveMaxHp) -> 7. `healing-C049` (prisma: full HP, clear status, heal injuries, restore all moves)
**Breaks at:** complete

### Chain 7: Character Natural Injury Healing
1. `healing-C040` (component: HealingTab -- handleHealInjury('natural')) -> 2. `healing-C023` (composable: healInjury()) -> 3. `healing-C004` (api: characters/:id/heal-injury) -> 4. `healing-C014` (utility: canHealInjuryNaturally) -> 5. `healing-C013` (utility: shouldResetDailyCounters) -> 6. `healing-C048` (prisma: update injuries, injuriesHealedToday)
**Breaks at:** complete

### Chain 8: Character AP Drain Injury Healing
1. `healing-C040` (component: HealingTab -- handleHealInjury('drain_ap')) -> 2. `healing-C023` (composable: healInjury()) -> 3. `healing-C004` (api: characters/:id/heal-injury with method='drain_ap') -> 4. `healing-C013` (utility: shouldResetDailyCounters) -> 5. `healing-C048` (prisma: update injuries, drainedAp, currentAp, injuriesHealedToday)
**Breaks at:** complete

### Chain 9: Pokemon Natural Injury Healing
1. `healing-C040` (component: HealingTab -- handleHealInjury('natural')) -> 2. `healing-C023` (composable: healInjury()) -> 3. `healing-C009` (api: pokemon/:id/heal-injury) -> 4. `healing-C014` (utility: canHealInjuryNaturally) -> 5. `healing-C013` (utility: shouldResetDailyCounters) -> 6. `healing-C049` (prisma: update injuries, injuriesHealedToday)
**Breaks at:** complete

### Chain 10: Per-Entity New Day Reset
1. `healing-C040` (component: HealingTab -- handleNewDay) -> 2. `healing-C024` (composable: newDay()) -> 3. `healing-C005` or `healing-C010` (api: characters/:id/new-day or pokemon/:id/new-day) -> 4. `healing-C054` (utility: calculateMaxAp, for character) -> 5. `healing-C057` (utility: resetDailyUsage, for character's Pokemon) -> 6. `healing-C048`/`healing-C049` (prisma: reset counters)
**Breaks at:** complete

### Chain 11: Global New Day Reset
1. `healing-C043` (component: GM Layout Advance Day button) -> 2. `healing-C025` (composable: newDayGlobal()) -> 3. `healing-C011` (api: game/new-day) -> 4. `healing-C057` (utility: resetDailyUsage for all Pokemon) -> 5. `healing-C054` (utility: calculateMaxAp per character level) -> 6. `healing-C048` + `healing-C049` (prisma: updateMany on both models)
**Breaks at:** complete

### Chain 12: In-Combat Healing
1. `healing-C039` (composable: useEncounterActions.handleHeal) -> 2. `healing-C035` (store: encounter.healCombatant) -> 3. `healing-C028` (api: encounters/:id/heal) -> 4. `healing-C030` (service: applyHealingToEntity) -> 5. `healing-C052` (utility: getEffectiveMaxHp) -> 6. `healing-C031` (service: syncHealingToDatabase) -> 7. `healing-C047` (websocket: heal_applied broadcast)
**Breaks at:** complete

### Chain 13: Take a Breather
1. (composable: useEncounterActions maneuver routing) -> 2. `healing-C036` (store: encounterCombat.takeABreather) -> 3. `healing-C029` (api: encounters/:id/breather) -> 4. `healing-C034` (service: createDefaultStageModifiers) -> 5. `healing-C062` (utility: Heavy Armor speed CS override) -> 6. `healing-C046` (constant: BREATHER_CURED_CONDITIONS) -> 7. DB sync via encounter update
**Breaks at:** complete

### Chain 14: Injury from Damage (Foundation for Healing)
1. Damage action -> 2. `healing-C033` (service: calculateDamage -- injury detection) -> 3. `healing-C032` (service: syncDamageToDatabase -- sets lastInjuryTime) -> 4. `healing-C048`/`healing-C049` (prisma: injuries, lastInjuryTime)
**Breaks at:** complete

### Chain 15: Healing Status Display
1. `healing-C041`/`healing-C042` (pages: character/Pokemon sheet) -> 2. `healing-C040` (component: HealingTab) -> 3. `healing-C026` (composable: getHealingInfo) -> 4. `healing-C019` (utility: getRestHealingInfo) -> 5. `healing-C014` (utility: canHealInjuryNaturally) -> 6. `healing-C052` (utility: getEffectiveMaxHp, via hpPerRest calculation)
**Breaks at:** complete

---

## Accessibility Summary

| View | Capabilities | Notes |
|------|-------------|-------|
| `gm` | C001-C011 (all APIs), C019-C027 (all composables), C035-C043 (all stores + components), C047-C051 (WS + types) | Full healing control on character/Pokemon sheets and encounter healing |
| `group` | C047 (heal_applied WS event) | Receives healing broadcasts to update encounter display |
| `player` | None | No healing actions available from player view |
| `api-only` | C012-C018, C030-C034, C044-C046, C052-C062 | Pure utilities, service functions, constants, and type definitions |

---

## Missing Subsystems

1. **Player-initiated healing** -- Players cannot trigger rest, extended rest, Pokemon Center, or injury healing from the player view. All healing is GM-only. A player requesting healing must verbally ask the GM.

2. **Batch healing** -- No batch rest/heal endpoint exists. To rest an entire party, the GM must click rest on each character and each Pokemon individually. A "rest all party" bulk action would streamline this.

3. **Pokemon Center for party** -- No single-action "Pokemon Center the whole party" endpoint. Each character and Pokemon must be individually Pokemon-Center healed.

4. **Scene-end AP restoration** -- The utility `calculateSceneEndAp` exists (healing-C056) but no endpoint or UI triggers it. When a scene ends or encounter ends, AP is not automatically restored per PTU rules.

5. **Extended Rest daily move rolling window feedback** -- The Pokemon extended-rest API returns `skippedMoves` (moves that were not refreshed because they were used today), but the HealingTab UI does not display this information to the user.

6. **Healing from player view** -- The HealingTab component only appears on GM character/Pokemon sheets. No equivalent exists in the player view for self-service healing.

7. **Automatic daily counter reset** -- Daily counters are only reset when an endpoint explicitly checks via `shouldResetDailyCounters` or when the GM clicks "Advance Day". There is no automatic time-based reset at midnight.
