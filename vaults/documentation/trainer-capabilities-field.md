# Trainer Traits Field

`HumanCharacter.traits` — stores trainer-specific [[trait-definition|traits]] such as [[naturewalk|Naturewalk]].

## Data Flow

Wired through serializers, the [[combatant-type-hierarchy|combatant service]], and character APIs (POST `/api/characters`, PUT `/api/characters/:id`). See [[character-api-endpoints]].

## VTT Usage

Parsed by combatant trait utilities:

- `getCombatantNaturewalks` — Extract Naturewalk types.
- `naturewalkBypassesTerrain` — Check terrain movement bypass.
- `findNaturewalkImmuneStatuses` — Check status immunity from Naturewalk.

## UI

Editable in `gm/characters/[id].vue`. Displayed in character sheet components.

## See also

- [[trainer-derived-stats]]
- [[character-api-endpoints]]
