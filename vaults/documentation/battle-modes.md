# Battle Modes

Two battle modes determine the [[turn-lifecycle]] structure:

- **Full Contact** — Single initiative list, `pokemon` phase only. All combatants act in speed order.
- **League / Trainer** — Three phases per round: `trainer_declaration` (low-to-high speed), `trainer_resolution` (high-to-low speed), then `pokemon` phase. Faster trainers see slower declarations before resolving. Death is suppressed in League mode.

Battle mode is selected during [[scene-to-encounter-conversion]] via the `StartEncounterModal`.

## See also

- [[initiative-and-turn-order]] — how combatant ordering differs between modes
- [[turn-lifecycle]] — the phase structure these modes determine
- [[player-combat-composable]] — isLeagueBattle/isTrainerPhase/isPokemonPhase detection
- [[player-combat-action-panel]] — league phase indicator and canBeCommanded check
