---
cap_id: combat-C004
name: Encounter League Battle Fields
type: prisma-field
domain: combat
---

### combat-C004: Encounter League Battle Fields
- **cap_id**: combat-C004
- **name**: League Battle Phase Tracking
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Encounter.currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`
- **game_concept**: PTU League Battle mode — trainers declare first (low-to-high speed), then Pokemon act (high-to-low speed)
- **description**: Tracks battle phase (trainer_declaration, trainer_resolution, pokemon), separate turn orders for trainers and pokemon. Phase transitions handled by next-turn endpoint.
- **inputs**: Set on encounter start; advanced by next-turn
- **outputs**: Phase and turn order arrays on encounter object
- **accessible_from**: gm, group, player
