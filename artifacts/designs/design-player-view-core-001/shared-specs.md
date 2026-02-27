# Shared Specifications

## 9. Files to Create/Modify Summary

### All Phases Combined

#### New Files (14)

| Phase | File | Lines (est.) |
|-------|------|-------------|
| P0 | `app/stores/playerIdentity.ts` | ~80 |
| P0 | `app/composables/usePlayerIdentity.ts` | ~100 |
| P0 | `app/components/player/PlayerIdentityPicker.vue` | ~200 |
| P0 | `app/components/player/PlayerCharacterSheet.vue` | ~350 |
| P0 | `app/components/player/PlayerPokemonTeam.vue` | ~120 |
| P0 | `app/components/player/PlayerPokemonCard.vue` | ~250 |
| P0 | `app/components/player/PlayerMoveList.vue` | ~150 |
| P0 | `app/components/player/PlayerNavBar.vue` | ~120 |
| P0 | `app/components/player/PlayerEncounterView.vue` | ~300 |
| P0 | `app/components/player/PlayerCombatantInfo.vue` | ~200 |
| P0 | `app/server/api/characters/[id]/player-view.get.ts` | ~60 |
| P0 | `app/assets/scss/components/_player-view.scss` | ~300 |
| P1 | `app/composables/usePlayerCombat.ts` | ~150 |
| P1 | `app/components/player/PlayerCombatActions.vue` | ~250 |

**Total new: ~2,630 lines across 14 files**

#### Modified Files (7)

| Phase | File | Change Description |
|-------|------|--------------------|
| P0 | `app/pages/player/index.vue` | Complete rewrite: identity, tab nav, sub-views |
| P0 | `app/layouts/player.vue` | Add top bar, bottom nav slot, mobile optimization |
| P0 | `app/server/routes/ws.ts` | Add player role to identify, update player_action handler |
| P0 | `app/server/utils/websocket.ts` | Add `'player'` to `ClientInfo.role` union type |
| P0 | `app/composables/useWebSocket.ts` | Update `identify()` to accept `characterId` parameter |
| P0 | `app/types/api.ts` | Add `PlayerActionRequest`, update `identify` event type |
| P1 | `app/components/encounter/PlayerActionPanel.vue` | Update to use PTU turn state or deprecate |

---


## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Player directly calling encounter mutations could conflict with GM actions | Data corruption | Server validates turn ownership before allowing mutations. Only the current combatant's owner can execute direct actions. |
| Multiple players connected simultaneously cause race conditions | Inconsistent state | WebSocket state sync is broadcast-based (eventual consistency). Only one combatant acts at a time (turn-based). |
| Mobile Safari WebSocket disconnects on screen lock | Lost connection | Reconnect on visibility change event (`document.visibilitychange`). Re-identify and re-join on reconnect. |
| Large Pokemon team data causes slow page loads on mobile | Poor UX | Lazy-load Pokemon details on card expand. Use lightweight summary in team list. |
| Player tries to act during someone else's turn | Confusion | Action panel is completely hidden when not the player's turn. Server rejects out-of-turn actions. |

---


## 11. Out of Scope (Track B / Track C / Future)

- **Remote access over internet** (Track B: reverse proxy, HTTPS, authentication)
- **Group View control from player actions** (Track C: WebSocket protocol for group -> player sync)
- **VTT grid interaction for players** (Track C: token drag on simplified grid)
- **Player editing of character stats** (Future P3: requires optimistic locking)
- **Chat/messaging between players and GM** (Future)
- **Dice roller in player view** (Future: players can use physical dice or a separate app)
- **Knowledge checks / Pokedex unlocking** (Future: dynamic information visibility based on education checks)
- **Scene view for players** (Track C: players seeing the current scene, weather, location)
- **Out-of-combat Pokemon management** (healing, teaching moves — GM-controlled)

---

