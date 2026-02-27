---
cap_id: player-view-C089
name: player-view-C089
type: —
domain: player-view
---

### player-view-C089
- **name:** PlayerActionType union
- **type:** constant
- **location:** `app/types/player-sync.ts` — PlayerActionType
- **game_concept:** All player combat action types
- **description:** Union of 8 action types: direct actions (use_move, shift, struggle, pass) that execute immediately, and requested actions (use_item, switch_pokemon, maneuver, move_token) that require GM approval.
- **inputs:** N/A (type definition)
- **outputs:** N/A (type definition)
- **accessible_from:** player

---

## Capability Chains

### Chain 1: Identity Selection and Data Loading
1. Player opens `/player` (player-view-C081)
2. **PlayerIdentityPicker** fetches `GET /api/characters/players` (player-view-C001, C012)
3. Player selects a character (player-view-C004)
4. **usePlayerIdentity.selectCharacter** stores to localStorage and fetches `GET /api/characters/:id/player-view` (player-view-C004, C011)
5. **playerIdentity store** populated with character + pokemon (player-view-C007)
6. **usePlayerWebSocket** auto-identifies on WebSocket as 'player' (player-view-C048, C056)
7. Encounter polling starts (player-view-C075)

**Accessible from:** `player` (entire chain is player-only)

### Chain 2: Combat Turn Execution
1. GM sends **player_turn_notify** WebSocket event (player-view-C059)
2. **usePlayerWebSocket.handleTurnNotify** triggers haptic feedback (player-view-C051, C076)
3. Player page auto-switches to Encounter tab (player-view-C083)
4. **PlayerEncounterView** shows with **PlayerCombatActions** panel (player-view-C027, C030)
5. Player selects a move -> target selector overlay (player-view-C046)
6. Player confirms targets -> **usePlayerCombat.executeMove** (player-view-C034)
7. encounterStore sends move execution to server API

**Accessible from:** `player` (entire chain is player-only)

### Chain 3: GM-Approved Action Request
1. Player clicks Use Item / Switch Pokemon / Maneuver (player-view-C030)
2. **usePlayerCombat.requestUseItem/requestSwitchPokemon/requestManeuver** (player-view-C038/C039/C040)
3. WebSocket sends **player_action** event (player-view-C057)
4. Server routes to GM via **forwardToGm** (player-view-C057)
5. GM responds with **player_action_ack** (player-view-C058)
6. Server routes ack via **pendingRequests** lookup (player-view-C086)
7. **usePlayerWebSocket.handleActionAck** resolves promise, shows toast (player-view-C050)

**Accessible from:** `player` (initiates), `gm` (approves/rejects)

### Chain 4: Grid Token Movement
1. Player taps own token on grid -> **selectToken** (player-view-C069)
2. Player taps destination cell -> **setMoveTarget** calculates PTU diagonal distance (player-view-C069)
3. **PlayerMoveRequest** confirmation sheet appears (player-view-C073)
4. Player confirms -> **confirmMove** sends **player_move_request** (player-view-C071, C060)
5. GM responds with **player_move_response** (player-view-C061)
6. **handleMoveResponse** clears pending state (player-view-C069)

**Accessible from:** `player` (initiates), `gm` (approves/rejects)

### Chain 5: Character Export/Import
1. Player clicks Export in character sheet (player-view-C022)
2. **handleExport** fetches `GET /api/player/export/:characterId` (player-view-C013)
3. Downloads JSON file with character + pokemon data
4. Offline: player edits notes, nicknames, etc.
5. Player clicks Import, selects file (player-view-C023)
6. **handleImportFile** sends to `POST /api/player/import/:characterId` (player-view-C014)
7. Server merges safe fields with conflict detection (player-view-C014)
8. Result banner shows updates and any conflicts (player-view-C021)

**Accessible from:** `player` (entire chain is player-only)

### Chain 6: Scene Synchronization
1. GM activates a scene -> **scene_activated** WebSocket event (player-view-C055)
2. **usePlayerWebSocket** catches event, calls **fetchActiveScene** (player-view-C066)
3. REST fetch from `GET /api/scenes/active` (player-view-C016)
4. **PlayerSceneView** renders scene data (player-view-C065)
5. GM makes changes -> granular events (scene_update, etc.) -> re-fetch (player-view-C055)
6. GM deactivates scene -> **scene_deactivated** -> clear activeScene (player-view-C066)

**Accessible from:** `player` (receives), `gm` (triggers)

### Chain 7: Reconnection Recovery
1. WebSocket disconnects -> reconnecting banner shown (player-view-C081)
2. WebSocket reconnects -> **useStateSync.performSync** triggered (player-view-C074)
3. Re-identifies as player, rejoins encounter, requests sync (player-view-C074)
4. Re-fetches character data via REST (player-view-C005)
5. Scene and tab state restored (player-view-C074)

**Accessible from:** `player` (entire chain is player-only)

### Chain 8: Group View Control
1. Player views Scene tab with group control (player-view-C077)
2. Player clicks "Request Scene" or "Request Lobby" (player-view-C077)
3. **group_view_request** sent via WebSocket (player-view-C062)
4. GM responds with **group_view_response** (player-view-C063)
5. Feedback shown (approved/rejected), 30-second cooldown starts (player-view-C077)

**Accessible from:** `player` (initiates), `gm` (approves/rejects)

---

## Accessibility Summary

| View | Capability IDs | Count |
|------|----------------|-------|
| `player` | C001-C089 (all) | 89 |
| `gm` (sends/receives) | C058, C059, C061, C063 (WebSocket routing) | 4 |
| `gm` (callable) | C011, C012, C013, C016, C085 | 5 |
| `group` | C057 (can send player_action when in encounter), C084 | 2 |
| `api-only` | C086 (pendingRequests server utility) | 1 |

The vast majority of player-view capabilities are exclusively accessible from the `player` route. The GM interacts with the player view indirectly through WebSocket event routing (sending turn notifications, responding to action requests, etc.).

---

## Missing Subsystems

The following PTU player actions or game concepts are NOT supported in the current player view:

### 1. Pokemon Ordering / Party Management
- **PTU Concept:** Players can reorder their Pokemon team, set a lead Pokemon, and manage party composition.
- **Gap:** The player view shows Pokemon in their stored order but provides no way to reorder them or change the active Pokemon. The active Pokemon is set by the GM (via the GM view).

### 2. Item Usage (Standalone)
- **PTU Concept:** Players use items outside of combat (healing items, TMs, evolution stones, etc.).
- **Gap:** Item usage only exists as a GM-approval request during combat. There is no player-side item usage for out-of-combat situations (e.g., using a Potion between encounters, applying TMs, using held items).

### 3. Skill Checks / Dice Rolls
- **PTU Concept:** Players make skill checks (Athletics, Acrobatics, Perception, etc.) by rolling dice.
- **Gap:** The player view displays skill ranks but provides no way to initiate or roll skill checks. All dice rolling must be done by the GM or externally.

### 4. Pokemon Capture (Player-Initiated)
- **PTU Concept:** Players throw Poke Balls to capture wild Pokemon.
- **Gap:** The capture system exists (server endpoints, capture rate calculator, useCapture composable) but is only accessible from the GM view. Players cannot initiate a capture attempt from their view.

### 5. Trainer Features / Edges Activation
- **PTU Concept:** Many trainer features and edges have active effects that are triggered by the player (e.g., "Orders" that buff Pokemon, "Focused Training" that grants bonuses).
- **Gap:** Features and edges are displayed as static tags in the character sheet. There is no mechanism for players to activate, toggle, or use them.

### 6. Pokemon Evolution
- **PTU Concept:** Pokemon evolve when they reach certain levels or conditions.
- **Gap:** No player-side mechanism to trigger or view evolution. This is handled entirely by the GM.

### 7. Money / Shopping
- **PTU Concept:** Players buy and sell items, manage their money.
- **Gap:** Money is displayed in the inventory section but there is no shop interface or buy/sell functionality from the player view.

### 8. Trainer Combat Actions (Full Contact Mode)
- **PTU Concept:** In Full Contact battles, trainers can fight alongside their Pokemon with physical attacks and struggle.
- **Gap:** The combat actions panel focuses on Pokemon moves. When the active combatant is a trainer (not a Pokemon), the move section is hidden and only Shift/Struggle/Pass are available. Trainer features that function as attacks are not represented.

### 9. Rest / Healing (Player-Initiated)
- **PTU Concept:** Players can initiate rests (30-minute, extended rest) and use healing items.
- **Gap:** All rest and healing actions are GM-only via the GM view. Players cannot trigger rests from their view, even though the useRestHealing composable exists.

### 10. Notes / Journal
- **PTU Concept:** Players take session notes, track quests, record NPC names, etc.
- **Gap:** Character notes field exists and is importable/exportable, but there is no in-app editing interface for notes. Players can only modify notes via the export-edit-import workflow.

### 11. Pokemon XP / Level Progress
- **PTU Concept:** Players track their Pokemon's XP progression toward the next level.
- **Gap:** Pokemon level is displayed but XP tracking, level progress bars, and manual XP logging are only available from the GM view.

### 12. Chat / Communication
- **PTU Concept:** Players communicate with the GM and other players during sessions.
- **Gap:** No in-app chat or messaging system. Communication relies on external tools. The player_action request system is the closest analog but is limited to combat action requests.
