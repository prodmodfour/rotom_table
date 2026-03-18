Beyond the [[encounter-service-is-the-combat-engine-core]], specialized services implement individual PTU combat subsystems:

- **combatant.service.ts** — damage calculation (PTU massive damage, HP markers), healing, status condition management with CS auto-apply/reverse, stage modifiers, evasion calculation, and `buildCombatantFromEntity()` — the single canonical combatant constructor.
- **status-automation.service.ts** — tick damage at turn end: Burn, Poison, Badly Poisoned (escalating), Cursed.
- **weather-automation.service.ts** — weather tick damage at turn start (Hail/Sandstorm), weather ability effects (Ice Body, Rain Dish, Solar Power, Dry Skin).
- **out-of-turn.service.ts** — Attack of Opportunity detection/resolution for all five PTU trigger types, Hold Action, Priority Actions, Interrupt framework.
- **intercept.service.ts** — Intercept Melee and Intercept Ranged per PTU p.242.
- **switching.service.ts** — recall beam range validation (8m), initiative insertion, forced switch handling, volatile condition clearing, terrain re-application on send-out.
- **mounting.service.ts** — Mountable capability validation, capacity checks, adjacency, Ride as One evasion sharing, faint auto-dismount.
- **living-weapon.service.ts** — engage/disengage, equipment bonus integration, weapon move injection (filtered by wielder Combat rank). Re-exports from three sub-services (state, movement, abilities).
- **healing-item.service.ts** — item validation and application for restorative, cure, combined, and revive categories with adjacency checks.
- **ball-condition.service.ts** — builds conditional context for Poke Ball modifier calculation from encounter and ownership data.

## See also

- [[services-are-stateless-function-modules]]
- [[encounter-api-has-50-plus-combat-endpoints]]
- [[ball-condition-service-builds-capture-modifier-context]] — detailed breakdown of ball context building
- [[turn-helpers-extract-round-lifecycle-functions]] — imports from several of these services
