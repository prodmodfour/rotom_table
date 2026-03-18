The turn helpers utility (`app/server/utils/turn-helpers.ts`) contains functions extracted from the next-turn endpoint to manage round lifecycle, phase transitions, and skip logic.

`resetResolvingTrainerTurnState()` resets a trainer's action economy when entering their resolution turn in League Battle mode. It clears `hasActed`, restores standard and shift action counts, clears temporary conditions (Sprint, Tripped), and preserves any forfeit flags from item use.

`resetAllTrainersForResolution()` bulk-resets `hasActed` for all trainers entering the resolution phase — their declaration-phase marking needs to be cleared so the UI does not show them as already acted.

The file also handles weather tick processing: applying Hail and Sandstorm damage at turn start via weather-automation.service, checking for faint cascades after weather damage, and auto-dismounting fainted mounted combatants through mounting.service. Both are part of the [[combat-services-cover-ptu-subsystems]].

Skip logic determines which combatants to skip during turn advancement: fainted combatants, undeclared combatants in League Battle, and uncommandable Pokemon.

## See also

- [[encounter-service-is-the-combat-engine-core]] — the next-turn endpoint that uses these helpers
- [[server-utils-layer-provides-shared-helpers]] — the utils layer where this file lives
- [[combat-services-cover-ptu-subsystems]] — the services imported by turn helpers
