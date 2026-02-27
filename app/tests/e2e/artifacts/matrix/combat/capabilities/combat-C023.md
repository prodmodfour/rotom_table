---
cap_id: combat-C023
name: Modify Combat Stages
type: api-endpoint
domain: combat
---

### combat-C023: Modify Combat Stages
- **cap_id**: combat-C023
- **name**: Modify Combat Stage Modifiers
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/stages.post.ts`
- **game_concept**: PTU combat stages (-6 to +6) for atk, def, spA, spD, spe, accuracy, evasion
- **description**: Updates combat stages on a combatant. Supports delta or absolute mode. Clamps to -6/+6.
- **inputs**: `{ combatantId, changes: Record<stat, value>, absolute? }`
- **outputs**: Updated encounter + stage change details
- **accessible_from**: gm
