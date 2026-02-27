---
cap_id: combat-C015
name: Start Encounter
type: api-endpoint
domain: combat
---

### combat-C015: Start Encounter
- **cap_id**: combat-C015
- **name**: Start Encounter (Initiative Sort)
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/start.post.ts`
- **game_concept**: Initiating combat — initiative sorting, phase setup
- **description**: Activates the encounter, sorts combatants by initiative (with roll-off for ties), resets turn states, resets scene-frequency moves. For League battles: separates trainer declaration order (low-to-high speed) and pokemon action order (high-to-low speed), starts in trainer_declaration phase.
- **inputs**: Encounter ID
- **outputs**: Encounter with sorted turnOrder, active state, phase
- **accessible_from**: gm
