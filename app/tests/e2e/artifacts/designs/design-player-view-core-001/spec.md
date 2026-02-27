# Specification

## 1. Player Identity

### 1.1 Character Selection Flow

When a player first opens `/player`, they see a character picker overlay. The picker:

1. Fetches all player characters from `GET /api/characters/players` (existing endpoint).
2. Displays them as selectable cards (avatar/initial, name, trainer classes, Pokemon team preview).
3. On selection, stores `{ characterId, characterName }` in localStorage key `ptu_player_identity`.
4. Subsequent visits skip the picker unless the player taps a "Switch Character" button in the nav bar.

### 1.2 localStorage Schema

```typescript
interface PlayerIdentity {
  characterId: string
  characterName: string
  selectedAt: string // ISO timestamp
}
```

Key: `ptu_player_identity`

### 1.3 Multi-Player Simultaneous Connections

Each browser tab connects to the WebSocket and identifies with `{ role: 'player', characterId }`. The server tracks which character each player connection represents. This enables:

- Per-player filtering: only show "Your Turn" actions when the active combatant belongs to the identified character.
- Per-player data: the player only sees full details for their own character and Pokemon.
- Multiple players can connect simultaneously without conflict because each has a distinct characterId.

### 1.4 Composable: `usePlayerIdentity`

```typescript
interface UsePlayerIdentity {
  identity: Ref<PlayerIdentity | null>
  character: Ref<HumanCharacter | null>
  pokemon: Ref<Pokemon[]>
  isIdentified: Ref<boolean>
  loading: Ref<boolean>

  selectCharacter(characterId: string): Promise<void>
  clearIdentity(): void
  refreshCharacterData(): Promise<void>
}
```

- `selectCharacter()` saves to localStorage, fetches full character data from `GET /api/characters/{id}/player-view`, and stores in reactive state.
- `refreshCharacterData()` re-fetches the character from the server (called on WebSocket `character_update` events).
- `clearIdentity()` removes from localStorage and resets state to show the picker.

### 1.5 Store: `playerIdentity`

A dedicated Pinia store for the player's identity and full character data. Separate from the encounter store to follow ISP — components that need identity data should not pull in encounter state.

```typescript
interface PlayerIdentityState {
  characterId: string | null
  character: HumanCharacter | null
  pokemon: Pokemon[]
  loading: boolean
  error: string | null
}
```

---


## 2. Character Sheet View

### 2.1 Permission Model

**Read-only for players.** The GM is the source of truth for all character data. Players can view:

| Data | Visibility | Editable by Player? |
|------|-----------|---------------------|
| Name, level, trainer classes | Full | No |
| HP (current/max) | Full | No |
| Stats (all 6 + stage modifiers) | Full | No |
| Skills | Full | No |
| Features & Edges | Full (names only, no descriptions) | No |
| Inventory | Full | No |
| Equipment | Full | No |
| Pokemon team | Full | No |
| Status conditions | Full | No |
| Injuries | Full | No |
| AP (current/max/drained/bound) | Full | No |
| Notes/background | Full | No |

**Rationale:** Editable fields would require conflict resolution between GM and player changes. The GM app already handles all stat mutations. Adding player edits introduces complexity (merge conflicts, race conditions) without proportional benefit for a LAN tool. If player editing is desired later, it can be added as a P3 enhancement with optimistic locking.

### 2.2 Component: `PlayerCharacterSheet`

A scrollable, mobile-optimized view of the character's data. Organized into collapsible sections:

1. **Header:** Avatar, name, level, trainer classes, HP bar.
2. **Stats:** 6 stats displayed as a compact grid (2x3 on mobile). Stage modifiers shown as +/- badges.
3. **Combat Info:** Physical/Special/Speed evasion, action points, injuries, status conditions.
4. **Skills:** List format, rank shown as badge (color-coded by rank).
5. **Features & Edges:** Collapsible lists with names.
6. **Equipment:** Slot-based display (6 slots).
7. **Inventory:** Scrollable item list with quantities.

### 2.3 API Endpoint: `GET /api/characters/{id}/player-view`

A new endpoint that returns the full character data WITH Pokemon team data (joins Pokemon table). This is distinct from the existing `GET /api/characters/{id}` to ensure the Pokemon array is always populated and formatted for the player view.

Response shape:
```typescript
{
  success: true,
  data: {
    character: HumanCharacter, // Full character with all fields
    pokemon: Pokemon[]          // Full Pokemon data for the team
  }
}
```

---


## 3. Pokemon Management

### 3.1 Team View: `PlayerPokemonTeam`

Displays all Pokemon owned by the player's character. Each Pokemon is shown as a card (`PlayerPokemonCard`) with:

- Sprite (pixelated, B2W2 style for Gen 5 and below, 3D for Gen 6+)
- Nickname / Species name
- Types (color-coded badges)
- HP bar (current/max)
- Level
- Status conditions (if any)
- Held item (if any)
- Active indicator (if this is the character's `activePokemonId`)

Tapping a Pokemon card expands it to show full details (stats, moves, abilities).

### 3.2 Pokemon Detail: Expanded Card

When a Pokemon card is tapped/expanded, it shows:

- **Stats:** All 6 stats with stage modifiers (compact grid).
- **Moves:** Full move list with type, DB, AC, frequency, range, effect. Each move is tappable to read the full effect text.
- **Abilities:** Name and effect text.
- **Capabilities:** Overland, Swim, Sky, etc.
- **Injuries & Status:** Count and active conditions.

### 3.3 Switch Pokemon Action

During combat, when it is the player's trainer's turn, a "Switch Pokemon" button appears. This:

1. Opens a Pokemon team selector showing all non-fainted Pokemon.
2. Player taps the Pokemon to switch to.
3. Sends a `player_action` WebSocket message to the GM with `{ action: 'switch_pokemon', pokemonId }`.
4. The GM's app receives the request and can approve/execute it.

**Important:** A full Pokemon Switch (recall + release as one action) is a Standard Action in PTU. Individual Recall or Release actions are each a Shift Action. Switching out a Fainted Pokemon is also a Shift Action. The player view sends the *request*; the GM executes it using the existing encounter management tools and determines the correct action economy.

---


## 4. Combat Actions (Core)

This is the heart of Track A. When the player's combatant is the current turn holder, the action panel appears. All actions send requests to the server via the existing encounter store actions, with WebSocket broadcast handling state sync.

### 4.1 Turn Detection

The player view must determine when it is "their turn." A combatant belongs to the player if:

1. The combatant's `entityId` matches the player's `characterId` (for trainer combatants).
2. The combatant's `entityId` matches any of the player's `pokemon[].id` (for Pokemon combatants).
3. For League battles: check which phase is active (trainer vs pokemon) and match accordingly.

```typescript
const isMyTurn = computed(() => {
  const current = encounterStore.currentCombatant
  if (!current || !playerStore.character) return false

  const myCharId = playerStore.character.id
  const myPokemonIds = playerStore.pokemon.map(p => p.id)

  return current.entityId === myCharId || myPokemonIds.includes(current.entityId)
})

const myActiveCombatant = computed(() => {
  if (!isMyTurn.value) return null
  return encounterStore.currentCombatant
})
```

### 4.2 Action Set

The full PTU action set for players, mapped to the existing backend:

| Action | PTU Action Type | Backend Method | Player UI |
|--------|----------------|----------------|-----------|
| Use Move | Standard | `encounterStore.executeMove()` | Move list with target selector |
| Shift | Shift | `encounterStore.useAction(id, 'shift')` | Single tap button |
| Struggle | Standard | `encounterStore.executeMove(id, 'struggle', targets)` | Button + target selector |
| Pass Turn | N/A | `encounterStore.nextTurn()` or `encounterCombatStore.pass()` | Confirmation button |
| Use Item | Standard | Player request via WS (GM executes) | Item picker from inventory |
| Switch Pokemon | Standard (full switch) / Shift (recall or release individually, or fainted) | Player request via WS (GM executes) | Pokemon team selector |
| Combat Maneuver | Varies | Player request via WS (GM executes) | Maneuver grid |

### 4.3 Action Execution Model

Two categories of player actions:

**Direct actions** (the player's client calls the server API directly):
- Use Move (with accuracy roll, target selection, damage calculation)
- Shift
- Struggle
- Pass Turn

**Requested actions** (the player sends a WS message, GM approves):
- Use Item
- Switch Pokemon
- Combat Maneuvers (Push, Trip, Grapple, etc.)

**Rationale:** Direct actions have deterministic server-side logic already implemented. Maneuvers and items require GM judgment (e.g., whether the grapple succeeds, which item to use). Keeping these as requests preserves GM authority.

### 4.4 Use Move Flow

1. Player taps a move from their Pokemon's move list.
2. `PlayerMoveList` component highlights the selected move and shows target options.
3. Player selects target(s) from a simplified target list (combatant names, not a full grid).
4. The app calls `encounterStore.executeMove(actorId, moveId, targetIds)`.
5. The server processes the move (accuracy check, damage calculation, status effects).
6. WebSocket broadcasts the updated encounter state to all clients.
7. The player sees the result (hit/miss, damage, effects) in a brief result overlay.

**Move frequency enforcement:** The existing `checkMoveFrequency()` utility is used client-side to disable exhausted moves. Server-side validation also enforces this.

### 4.5 Target Selection

For the player view, target selection is a simplified list (not the full MoveTargetModal used by the GM). On mobile:

- **Single-target moves:** Show a scrollable list of valid targets (based on move range). Player taps one.
- **Multi-target moves:** Show checkboxes next to each valid target. Player selects all applicable, then confirms.
- **Self-targeting moves:** Auto-select the actor. No picker needed.

The target list shows: combatant name, type (for Pokemon), HP percentage bar, and side indicator (friendly/enemy).

### 4.6 Shift Action

A single "Shift" button. When tapped:

1. Calls `encounterStore.useAction(combatantId, 'shift')`.
2. The GM manually moves the token on the VTT grid (since the player view does not have grid interaction in Track A).
3. Server updates and broadcasts.

**Future (Track C or P2):** The player could drag their token on a simplified grid view to request a shift destination.

### 4.7 Struggle

Available when the Pokemon has no usable moves (all exhausted). Works like Use Move but with the predefined Struggle move:

```typescript
const struggleMove: Move = {
  id: 'struggle',
  name: 'Struggle',
  type: 'Normal',
  damageClass: 'Physical',
  frequency: 'At-Will',
  ac: 4,
  damageBase: 4,
  range: 'Melee',
  effect: 'Normal Type. AC 4, DB 4, Melee, Physical. No STAB. Does not count as a Move. Expert+ Combat Skill: AC 3, DB 5.'
}
```

### 4.8 Pass Turn

A "Pass Turn" button with confirmation dialog ("End your turn?"). Calls the pass endpoint, which marks all actions as used and advances to the next combatant.

### 4.9 Combat Maneuvers (Requested)

The player can browse the COMBAT_MANEUVERS constant and tap one. This sends a `player_action` message to the GM:

```typescript
{
  type: 'player_action',
  data: {
    playerId: characterId,
    action: 'maneuver',
    maneuverId: 'push', // or 'trip', 'grapple', etc.
    targetId: targetCombatantId // if applicable
  }
}
```

The GM sees this as a notification/request in their action panel and can execute it.

### 4.10 Use Item (Requested)

Player selects an item from their trainer's inventory. This sends:

```typescript
{
  type: 'player_action',
  data: {
    playerId: characterId,
    action: 'use_item',
    itemId: itemId,
    itemName: itemName,
    targetId: targetCombatantId // if applicable
  }
}
```

### 4.11 Switch Pokemon (Requested)

Player selects a Pokemon from their team (non-fainted, not already active). Sends:

```typescript
{
  type: 'player_action',
  data: {
    playerId: characterId,
    action: 'switch_pokemon',
    pokemonId: selectedPokemonId
  }
}
```

---


## 5. Information Visibility

### 5.1 Visibility Rules

| Entity | Relationship | HP | Stats | Moves | Abilities | Status | Injuries | Types |
|--------|-------------|-----|-------|-------|-----------|--------|----------|-------|
| Own trainer | Self | Exact | Full | N/A | N/A | Full | Full | N/A |
| Own Pokemon | Owned | Exact | Full | Full | Full | Full | Full | Full |
| Allied trainer | Ally | Exact | Hidden | N/A | N/A | Full | Visible | N/A |
| Allied Pokemon | Ally | Exact | Hidden | Hidden | Hidden | Full | Visible | Full |
| Enemy trainer | Opponent | % only | Hidden | N/A | N/A | Full | Hidden | N/A |
| Enemy Pokemon | Opponent | % only | Hidden | Hidden | Hidden | Full | Hidden | Full |

**Design decision:** Status conditions are always visible because they produce visible effects in the game world (a Burned creature is visibly on fire). Types are always visible for Pokemon because they can be inferred from appearance. HP percentage for enemies simulates the "it looks healthy/hurt/critical" assessment.

### 5.2 Implementation

The `PlayerCombatantCard` component already has a `showDetails` prop. This will be extended:

```typescript
interface CombatantVisibility {
  showExactHp: boolean    // false = show percentage only
  showStats: boolean       // full stat block
  showMoves: boolean       // move list
  showAbilities: boolean   // ability list
  showInjuries: boolean    // injury count
}

const getVisibility = (combatant: Combatant, myCharId: string, myPokemonIds: string[]): CombatantVisibility => {
  const isOwn = combatant.entityId === myCharId || myPokemonIds.includes(combatant.entityId)
  const isAlly = combatant.side === 'players' || combatant.side === 'allies'

  if (isOwn) return { showExactHp: true, showStats: true, showMoves: true, showAbilities: true, showInjuries: true }
  if (isAlly) return { showExactHp: true, showStats: false, showMoves: false, showAbilities: false, showInjuries: true }
  return { showExactHp: false, showStats: false, showMoves: false, showAbilities: false, showInjuries: false }
}
```

---


## 6. Component Architecture

### 6.1 Component Tree

```
pages/player/index.vue
  PlayerIdentityPicker.vue         (overlay when no identity)
  PlayerNavBar.vue                 (bottom navigation bar)
  [Tab: Character]
    PlayerCharacterSheet.vue       (full character sheet)
  [Tab: Team]
    PlayerPokemonTeam.vue          (Pokemon team list)
      PlayerPokemonCard.vue        (individual Pokemon card, expandable)
        PlayerMoveList.vue          (move list for a Pokemon)
  [Tab: Encounter]
    PlayerEncounterView.vue        (encounter state + actions)
      PlayerCombatantInfo.vue      (combatant cards, visibility-aware)
      PlayerCombatActions.vue      (action panel when it's player's turn)
        encounter/MoveTargetModal  (reuse existing, simplified for mobile)
```

### 6.2 Navigation

Bottom tab bar (mobile standard pattern). Three tabs:

1. **Character** (person icon): Character sheet view.
2. **Team** (pokeball icon): Pokemon team management.
3. **Encounter** (swords icon): Active encounter view with combat actions.

The encounter tab shows a notification badge when an encounter is active. When it is the player's turn, the badge pulses and the tab auto-navigates to the encounter view.

### 6.3 Layout: Mobile-First

The player layout (`app/layouts/player.vue`) will be updated:

```
+---------------------------+
|  PTU Session Helper       |  <- Top bar (character name, connection status)
|                           |
|  [Scrollable content]     |  <- Main area (tab content)
|                           |
|                           |
|                           |
+---------------------------+
| [Char] [Team] [Encounter] |  <- Bottom nav bar (fixed, always visible)
+---------------------------+
```

- **Top bar:** 48px fixed. Shows character name (or "Select Character"), connection indicator (green/red dot), and a menu button for "Switch Character."
- **Content area:** Fills remaining vertical space. Scrollable.
- **Bottom nav:** 56px fixed. Three tab buttons with icons and labels.

### 6.4 Responsive Breakpoints

| Width | Layout |
|-------|--------|
| 320-480px (phone portrait) | Single column, stacked sections, large touch targets |
| 481-768px (phone landscape / small tablet) | Wider cards, some 2-column grids |
| 769-1024px (tablet) | Side-by-side panels possible |
| 1025px+ (laptop/desktop) | Full desktop layout, but still player-optimized (not GM) |

### 6.5 Existing Component Reuse

- `encounter/MoveTargetModal.vue` — reuse for move target selection (may need mobile sizing adjustments).
- `encounter/PlayerCombatantCard.vue` — reuse for displaying combatants in the encounter view (update `showDetails` logic).
- `encounter/PlayerActionPanel.vue` — replace entirely with new `PlayerCombatActions.vue` (the existing one is a stub that uses legacy action tracking).
- `useCombatantDisplay.ts` — reuse for name resolution.
- `useCombat.ts` — reuse for HP percentage, health status, evasion calculations.
- `usePokemonSprite.ts` — reuse for sprite URLs.

---


## 7. WebSocket Protocol Updates

### 7.1 Current State Analysis

The `ws.ts` handler currently:
- Accepts `identify` with role `'gm' | 'group'` (the `'player'` role is accepted client-side but the server `ClientInfo` type only defines `'gm' | 'group'`).
- `player_action` events are only forwarded when sent by `group` role clients.
- No per-player filtering exists (all encounter broadcasts go to all clients in the encounter).

### 7.2 Required Changes

#### A. Update `ClientInfo` type to include `'player'` role

```typescript
interface ClientInfo {
  role: 'gm' | 'group' | 'player'
  encounterId?: string
  characterId?: string  // NEW: which character this player connection represents
}
```

#### B. Update `identify` handler to accept player role with characterId

```typescript
case 'identify':
  if (clientInfo) {
    const data = event.data as { role?: 'gm' | 'group' | 'player'; encounterId?: string; characterId?: string }
    clientInfo.role = data.role || 'group'
    clientInfo.encounterId = data.encounterId
    if (data.role === 'player') {
      clientInfo.characterId = data.characterId
    }
    // Send tab state to group clients
    if (clientInfo.role === 'group') {
      sendTabState(peer)
    }
  }
  break
```

#### C. Update `player_action` handler to accept from player role (not just group)

```typescript
case 'player_action':
  // Forward player actions to GM(s)
  if ((clientInfo?.role === 'player' || clientInfo?.role === 'group') && clientInfo.encounterId) {
    const playerEncounterId = clientInfo.encounterId
    for (const [otherPeer, otherInfo] of peers) {
      if (otherPeer !== peer && otherInfo.role === 'gm' && otherInfo.encounterId === playerEncounterId) {
        safeSend(otherPeer, JSON.stringify(event))
      }
    }
  }
  break
```

#### D. Update `WebSocketEvent` type to include new player action subtypes

Add to `app/types/api.ts`:

```typescript
// Player action requests (player -> GM via server)
| { type: 'player_action'; data: PlayerActionRequest }

// Player action types
interface PlayerActionRequest {
  playerId: string       // Character ID of the requesting player
  playerName: string     // Display name for GM notification
  action: 'use_move' | 'shift' | 'struggle' | 'pass' | 'use_item' | 'switch_pokemon' | 'maneuver'
  // Optional fields depending on action type
  moveId?: string
  moveName?: string
  targetIds?: string[]
  itemId?: string
  itemName?: string
  pokemonId?: string
  maneuverId?: string
  maneuverName?: string
}
```

### 7.3 New Message Types

| Message | Direction | Purpose |
|---------|-----------|---------|
| `identify` (updated) | Client -> Server | Now includes `characterId` for player role |
| `player_action` (updated) | Player -> GM | Structured action requests with typed payloads |
| `player_action_ack` | GM -> Player | GM acknowledges/rejects a player action (future Track C) |
| `player_turn_notify` | Server -> Player | Notify specific player that it is their turn (future Track C) |

---


## 8. Phase Plan

### P0: Player Identity + Character Sheet + Basic Encounter View

**Goal:** A player can open `/player`, select their character, view their character sheet and Pokemon team, and see an active encounter's state (whose turn, combatants, HP).

#### Files to Create

| File | Purpose |
|------|---------|
| `app/stores/playerIdentity.ts` | Pinia store for player identity and character data |
| `app/composables/usePlayerIdentity.ts` | Composable wrapping the store with localStorage and data fetching |
| `app/components/player/PlayerIdentityPicker.vue` | Character selection overlay |
| `app/components/player/PlayerCharacterSheet.vue` | Read-only character sheet view |
| `app/components/player/PlayerPokemonTeam.vue` | Pokemon team list |
| `app/components/player/PlayerPokemonCard.vue` | Individual Pokemon card (expandable) |
| `app/components/player/PlayerMoveList.vue` | Move list display for a Pokemon |
| `app/components/player/PlayerNavBar.vue` | Bottom tab navigation bar |
| `app/components/player/PlayerEncounterView.vue` | Basic encounter state display |
| `app/components/player/PlayerCombatantInfo.vue` | Visibility-aware combatant card |
| `app/server/api/characters/[id]/player-view.get.ts` | Full character + Pokemon endpoint |
| `app/assets/scss/components/_player-view.scss` | Player view SCSS styles |

#### Files to Modify

| File | Change |
|------|--------|
| `app/pages/player/index.vue` | Complete rewrite: add identity picker, tab navigation, route to sub-views |
| `app/layouts/player.vue` | Add top bar and bottom nav slot |
| `app/server/routes/ws.ts` | Update `ClientInfo` type, update `identify` handler for `player` role with `characterId` |
| `app/server/utils/websocket.ts` | Add `'player'` to `ClientInfo.role` type |
| `app/composables/useWebSocket.ts` | Update `identify()` signature to accept optional `characterId` |
| `app/types/api.ts` | Update `identify` event data type, add `PlayerActionRequest` |

#### Acceptance Criteria

- [ ] Opening `/player` shows a character picker with all player characters from the database.
- [ ] Selecting a character persists the choice in localStorage.
- [ ] Refreshing the page restores the selected character without re-picking.
- [ ] The Character tab shows a read-only character sheet with all fields from Section 2.
- [ ] The Team tab shows all Pokemon owned by the character with sprite, name, HP, types.
- [ ] Tapping a Pokemon card expands to show stats, moves, abilities.
- [ ] The Encounter tab shows the current encounter state (combatants by side, turn indicator, round number).
- [ ] Enemy combatants show HP percentage only (not exact values).
- [ ] Own and allied combatants show exact HP.
- [ ] WebSocket identifies as `player` role with `characterId`.
- [ ] WebSocket updates refresh encounter state in real time.
- [ ] The player can tap "Switch Character" to return to the picker.
- [ ] All views are usable on a 320px-wide phone screen.

### P1: Combat Actions + Pokemon Management

**Goal:** A player can execute the full PTU combat action set from their phone when it is their turn. They can also request item use, Pokemon switches, and combat maneuvers.

#### Files to Create

| File | Purpose |
|------|---------|
| `app/composables/usePlayerCombat.ts` | Combat action logic for player: turn detection, action execution, request sending |
| `app/components/player/PlayerCombatActions.vue` | Full action panel (moves, shift, struggle, pass, maneuvers, items, switch) |

#### Files to Modify

| File | Change |
|------|--------|
| `app/components/player/PlayerEncounterView.vue` | Add action panel when it is player's turn |
| `app/components/encounter/PlayerActionPanel.vue` | Either replace with PlayerCombatActions or update to use PTU turn state instead of legacy action tracking |
| `app/server/routes/ws.ts` | Update `player_action` handler to accept from `player` role clients |

#### Acceptance Criteria

- [ ] When the current combatant belongs to the player, an action panel appears.
- [ ] Pokemon combatants show their move list with type colors, DB, AC, frequency.
- [ ] Exhausted moves (frequency limit reached) are visually disabled with tooltip reason.
- [ ] Tapping a move opens a target selector showing valid targets.
- [ ] Selecting target(s) and confirming executes the move via `encounterStore.executeMove()`.
- [ ] The Shift button is available when the shift action is not yet used.
- [ ] The Struggle button is available when no moves can be used (or explicitly).
- [ ] The Pass Turn button ends the combatant's turn with confirmation.
- [ ] Combat Maneuvers are browsable in a collapsible section.
- [ ] Selecting a maneuver sends a `player_action` WebSocket message to the GM.
- [ ] The "Use Item" option shows the trainer's inventory and sends a request to the GM.
- [ ] The "Switch Pokemon" option shows non-fainted team Pokemon and sends a request to the GM.
- [ ] Turn state (standard/shift/swift action used) is displayed and respected.
- [ ] League battle phases (trainer declaration vs pokemon action) are handled correctly.
- [ ] All actions work on a 320px-wide phone screen with touch-friendly targets.

### P2: Polish, UX, Error Handling

**Goal:** The player view feels smooth, handles errors gracefully, and provides clear feedback for all actions.

#### Changes

| Area | Change |
|------|--------|
| Turn notification | Visual + haptic (vibration API) notification when it becomes the player's turn |
| Action feedback | Brief toast/overlay showing move result (hit/miss, damage dealt, effects applied) |
| Connection status | Clear indicator (green dot = connected, red dot = disconnected, reconnecting spinner) |
| Offline handling | Graceful degradation when WebSocket disconnects mid-encounter |
| Loading states | Skeleton screens for character data loading |
| Error handling | Specific alert messages for failed API calls (not generic "something went wrong") |
| Animation | Smooth tab transitions, action panel slide-up, card expand/collapse |
| Haptic feedback | Navigator.vibrate() on turn start, move execution, damage taken |
| Auto-scroll | Encounter view auto-scrolls to current combatant |
| Move details | Tap-and-hold on a move to see full effect text without executing |
| Confirmation | "Are you sure?" dialog before Pass Turn and destructive actions |
| 4K scaling | Ensure player view components scale properly on 4K when viewed on larger screens |
| Accessibility | aria-labels on all interactive elements, semantic HTML, focus management |

#### Acceptance Criteria

- [ ] Player receives a vibration and visual flash when their turn starts.
- [ ] Move results are shown as a brief overlay (auto-dismiss after 3 seconds).
- [ ] Disconnection shows a red indicator with "Reconnecting..." text.
- [ ] Reconnection automatically re-identifies and re-joins the encounter.
- [ ] All loading states show skeleton screens, not blank white spaces.
- [ ] Error messages identify the specific operation that failed.
- [ ] Tab transitions are animated (slide).
- [ ] All interactive elements have minimum 44x44px touch targets.
- [ ] Screen readers can navigate the player view meaningfully.

---

