# Combatant Card Subcomponents

Extracted sub-components of `CombatantCard`.

## CombatantGmActions.vue

GM action panel — damage/heal input controls, quick action buttons (+T/CS/ST), Use Item button, Act button, Switch/Fainted Switch/Force Switch buttons, Remove button.

Modals: `TempHpModal`, `CombatStagesModal`, `StatusConditionsModal`, `UseItemModal`.

Props: `combatant`, `displayName`, `currentTempHp`, `currentStages`, `statusConditions`, `entityTypes`.

Events: `damage`, `heal`, `stages`, `status`, `openActions`, `remove`, `switchPokemon`, `faintedSwitch`, `forceSwitch`.

## CombatantCaptureSection.vue

Capture [[capture-accuracy-gate|accuracy gate]] + [[poke-ball-system|capture panel]] integration for wild enemy Pokemon. Computes accuracy params from encounter combatant data and selects the throwing trainer.

## WeatherEffectIndicator.vue

P2 weather effect badge — shows damage/immune/heal/cure/boost status per combatant based on [[weather-rules-utility|weather abilities]]. Uses `WEATHER_ABILITY_EFFECTS`, `WEATHER_EVASION_ABILITIES`, `WEATHER_STATUS_CURE_ABILITIES`.

## See also

- [[encounter-component-categories]]
