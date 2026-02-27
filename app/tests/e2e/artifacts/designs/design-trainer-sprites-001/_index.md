---
design_id: design-trainer-sprites-001
ticket_id: feature-001
category: FEATURE_GAP
scope: SINGLE_PHASE
domain: character-lifecycle
status: implemented
affected_files:
  - app/components/character/HumanCard.vue
  - app/components/character/CharacterModal.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/PlayerCombatantCard.vue
  - app/components/encounter/GroupCombatantCard.vue
  - app/components/encounter/AddCombatantModal.vue
  - app/components/encounter/GMActionModal.vue
  - app/components/group/PlayerLobbyView.vue
  - app/components/group/InitiativeTracker.vue
  - app/components/group/CombatantDetailsPanel.vue
  - app/components/vtt/VTTToken.vue
  - app/components/scene/SceneCanvas.vue
  - app/components/scene/SceneAddPanel.vue
  - app/pages/gm/characters/[id].vue
  - app/pages/gm/create.vue
  - app/pages/group/_components/SceneView.vue
  - app/pages/group/_components/LobbyView.vue
new_files:
  - app/composables/useTrainerSprite.ts
  - app/components/character/TrainerSpritePicker.vue
  - app/constants/trainerSprites.ts
---


# Design: B2W2 Trainer Sprites for NPC/Player Avatars (feature-001)

## Overview

Human characters (NPCs and players) currently display letter-initial fallbacks because no avatar selection UI exists. The `avatarUrl` field on `HumanCharacter` already exists in both the Prisma schema and TypeScript types, and the API already serializes and persists it. This feature adds a trainer sprite picker that lets the GM assign B2W2-style trainer sprites to any human character, consistent with the existing Pokemon sprite aesthetic (Gen 1-5 Pokemon use B2W2 animated sprites via `usePokemonSprite.ts`).

### Goals

1. Provide a visual identity for every human character using the same B2W2 art style as Pokemon sprites
2. Sprite selection available during character creation (Quick Create and Full Create) and editing (character sheet page and CharacterModal)
3. All views (GM, Group, Player) render the selected sprite wherever avatars appear today
4. Letter-initial fallback remains for characters without a selected sprite
5. No schema migration required (the `avatarUrl` field already exists)

---


## Atomized Files

- [_index.md](_index.md)
- [spec.md](spec.md)
- [shared-specs.md](shared-specs.md)
- [implementation-log.md](implementation-log.md)
