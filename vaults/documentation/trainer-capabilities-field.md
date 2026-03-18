# Trainer Capabilities Field

`HumanCharacter.capabilities` — a `string[]` field (Prisma `String @default("[]")`). Stores trainer-specific capabilities such as Naturewalk from the Survivalist class (PTU p.149).

## Format

```json
["Naturewalk (Forest)", "Naturewalk (Mountain)"]
```

## Data Flow

Wired through serializers, the [[combatant-type-hierarchy|combatant service]], and character APIs (POST `/api/characters`, PUT `/api/characters/:id`). See [[character-api-endpoints]].

## VTT Usage

Parsed by `combatantCapabilities.ts`:

- `getCombatantNaturewalks` — Extract Naturewalk types.
- `naturewalkBypassesTerrain` — Check terrain movement bypass.
- `findNaturewalkImmuneStatuses` — Check status immunity from Naturewalk.

## UI

Editable in `gm/characters/[id].vue` Classes tab. Displayed in HumanClassesTab.vue and CharacterModal.vue.

## See also

- [[trainer-derived-stats]]
- [[character-api-endpoints]]
