---
design_id: design-player-view-core-001
ticket_id: feature-003
category: FEATURE
scope: FULL
domain: player-view
track: A (Core)
status: p0-implemented
parallel_tracks:
  - "Track B: Infrastructure/Remote Access (separate slave)"
  - "Track C: Integration (depends on A+B, future)"
affected_files:
  - app/pages/player/index.vue
  - app/layouts/player.vue
  - app/server/routes/ws.ts
  - app/server/utils/websocket.ts
  - app/composables/useWebSocket.ts
  - app/types/api.ts
  - app/components/encounter/PlayerCombatantCard.vue
  - app/components/encounter/PlayerActionPanel.vue
new_files:
  - app/composables/usePlayerIdentity.ts
  - app/composables/usePlayerCombat.ts
  - app/components/player/PlayerIdentityPicker.vue
  - app/components/player/PlayerCharacterSheet.vue
  - app/components/player/PlayerPokemonTeam.vue
  - app/components/player/PlayerPokemonCard.vue
  - app/components/player/PlayerMoveList.vue
  - app/components/player/PlayerCombatActions.vue
  - app/components/player/PlayerEncounterView.vue
  - app/components/player/PlayerCombatantInfo.vue
  - app/components/player/PlayerNavBar.vue
  - app/stores/playerIdentity.ts
  - app/server/api/characters/[id]/player-view.get.ts
  - app/assets/scss/components/_player-view.scss
---


# Design: Player View Core (Track A) — feature-003

## Overview

The Player View is the third interface of the Triple-View System. Players use their phones or laptops as a personal remote control while looking at the Group View on a shared TV/projector. This design covers Track A: the core in-session functionality — player identity, character sheet access, Pokemon team management, and the full PTU combat action set.

### Design Constraints

1. **Mobile-first.** The primary device is a phone held in portrait mode. All layouts must work at 320px width minimum. Touch targets must be at least 44x44px (Apple HIG) / 48x48dp (Material).
2. **No authentication.** This is a LAN TTRPG tool, not a public service. Player identity is a simple character picker persisted in localStorage.
3. **GM retains authority.** Players can *request* actions (use move, shift, pass) but the GM's app is the source of truth. The server processes all mutations. Players see the result via WebSocket state sync.
4. **Simultaneous connections.** Multiple players connect simultaneously, each identified by their character. The server must handle N player connections without conflict.
5. **Information asymmetry.** Players see their own data fully, allies partially, and enemies with limited information (HP percentage, visible status conditions, types). This is a PTU design decision: knowledge checks gate information.

### User Stories

- As a player, I want to select my character when I open the Player View so the app knows who I am.
- As a player, I want to see my character sheet (stats, HP, inventory, abilities) on my phone during a session.
- As a player, I want to see my Pokemon team, their moves, abilities, and HP at a glance.
- As a player, I want to use moves, shift, struggle, pass turn, and execute combat maneuvers from my phone when it is my turn.
- As a player, I want to see the encounter state (who is fighting, whose turn it is, round number) even when it is not my turn.
- As a player, I want to see enemy Pokemon types and HP percentage but not their exact stats.
- As a player, I want my character selection to persist across browser refreshes.
- As a player, I want to switch my active Pokemon during combat.

---


## Atomized Files

- [_index.md](_index.md)
- [spec.md](spec.md)
- [shared-specs.md](shared-specs.md)
- [implementation-log.md](implementation-log.md)
