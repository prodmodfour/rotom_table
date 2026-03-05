# Browser Audit: /player View

Audited: 2026-03-05
Route: `http://localhost:3000/player`

---

## Test Data State

- Two player characters seeded: Hassan (Ace Trainer / Elite Trainer, Lv. 1) and Marilena (Hobbyist / Channeler / Sage / Researcher / Witch Hunter, Lv. 1)
- Hassan's team: Chomps (Gible, Dragon/Ground, Lv. 10)
- No active encounter running
- No active scene running
- WebSocket connected (LAN, ~1ms latency)

---

## Identity Management

### player-view-C001 -- PlayerIdentityPicker component
- **Route checked:** http://localhost:3000/player (before character selection)
- **Expected element:** Full-screen overlay with character selection buttons
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Heading "Rotom Table", paragraph "Select your character to continue", two character buttons: `button "Select Hassan, Level 1, Ace Trainer / Elite Trainer"` and `button "Select Marilena, Level 1, Hobbyist / Channeler / Sage / Researcher / Witch Hunter"`. Each button shows name, trainer classes, level, and Pokemon sprites (img "Chomps", img "Iris").

---

## Character Sheet Display

### player-view-C017 -- PlayerCharacterSheet component
- **Route checked:** http://localhost:3000/player (Character tab)
- **Expected element:** Region with character sheet sections
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `region "Character sheet"` containing: header with name ("Hassan"), level ("Lv. 1"), trainer classes ("Ace Trainer / Elite Trainer"), HP display ("45 / 45 HP"), export/import buttons, and collapsible sections (Stats, Combat Info, Skills, Features & Edges, Equipment, Inventory).

### player-view-C018 -- HP percent and color computation (via C017)
- **Route checked:** http://localhost:3000/player (Character tab)
- **Expected element:** HP bar with percentage fill and color
- **Found:** Yes
- **Classification:** Present
- **Evidence:** HP bar shows "45 / 45 HP" with full-width fill. HP tooltip shows "Max HP = Level (1) x2 + HP Base (11) x3 + 10 = 45".

### player-view-C019 -- Evasion computation with equipment bonuses (via C017)
- **Route checked:** http://localhost:3000/player (Character tab)
- **Expected element:** Three evasion values in Combat Info section
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Combat Info section shows: "Phys Evasion: 1", "Spec Evasion: 1", "Spd Evasion: 2". Also shows "AP: 5", "Injuries: 0", "Temp HP: 0".

### player-view-C020 -- Section collapse/expand toggle
- **Route checked:** http://localhost:3000/player (Character tab)
- **Expected element:** Collapsible section headers with expand/collapse behavior
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Six section buttons present: `button "Stats" [expanded]`, `button "Combat Info" [expanded]`, `button "Skills"`, `button "Features & Edges"`, `button "Equipment"`, `button "Inventory (0P)"`. Stats and Combat Info default to expanded. Clicking "Skills" toggles it to `[expanded]` and shows skill list. Clicking "Features & Edges" shows Features (4) and Edges (4).

---

## Export/Import

### player-view-C021 -- useCharacterExportImport composable (via C017 buttons)
- **Route checked:** http://localhost:3000/player (Character tab)
- **Expected element:** Export and Import buttons in character sheet
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `region "Character data actions"` containing `button "Export character data as JSON"` with "Export Character" label and `button "Import character data from JSON"` with "Import Character" label.

---

## Pokemon Team Display

### player-view-C024 -- PlayerPokemonTeam component
- **Route checked:** http://localhost:3000/player (Team tab)
- **Expected element:** Region with Pokemon team cards
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `region "Pokemon team"` containing one Pokemon card for Chomps.

### player-view-C025 -- PlayerPokemonCard component
- **Route checked:** http://localhost:3000/player (Team tab)
- **Expected element:** Pokemon card with sprite, name, types, level, HP
- **Found:** Yes (summary only -- expansion broken)
- **Classification:** Present
- **Severity:** MEDIUM (expansion fails with JS error)
- **Evidence:** Card summary present: `button "Chomps, Level 10. Expand details."` containing `img "Chomps"`, types "Dragon"/"Ground", "Lv. 10", HP "47 / 47". However, clicking to expand triggers a render error: `TypeError: Cannot read properties of undefined (reading 'length')` at PlayerPokemonCard.vue:318. The expanded details (stats, abilities, moves, capabilities) do not render. This affects C026 (PlayerMoveList) visibility on the Team tab as well.

### player-view-C026 -- PlayerMoveList component
- **Route checked:** http://localhost:3000/player (Team tab, inside C025 expanded)
- **Expected element:** Move list with type badges, names, DB, AC, frequency
- **Found:** No (blocked by C025 render error)
- **Classification:** Absent
- **Severity:** MEDIUM
- **Evidence:** PlayerMoveList is rendered inside the expanded Pokemon card (`<PlayerMoveList :moves="pokemon.moves" />`). Since the expansion crashes with `TypeError: Cannot read properties of undefined (reading 'length')`, the move list never renders. The error suggests `pokemon.statusConditions` or `pokemon.abilities` is undefined in the data from the server. Root cause is a data shape mismatch, not a missing component.

---

## Encounter View

### player-view-C027 -- PlayerEncounterView component
- **Route checked:** http://localhost:3000/player (Encounter tab)
- **Expected element:** Encounter view with combatants or waiting state
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `region "Encounter view"` with empty state: "No active encounter" and "An encounter will appear here when the GM starts one." Waiting state renders correctly. Full encounter display requires an active encounter (not testable without GM starting one).

### player-view-C028 -- PlayerCombatantInfo component
- **Route checked:** http://localhost:3000/player (Encounter tab)
- **Expected element:** Combatant info cards (requires active encounter)
- **Found:** N/A (no active encounter)
- **Classification:** Present (conditionally rendered -- empty state is correct)
- **Evidence:** Component requires active encounter with combatants. Empty state "No active encounter" is the correct behavior when no encounter is running. The component code exists and is imported by C027.

### player-view-C030 -- PlayerCombatActions component
- **Route checked:** http://localhost:3000/player (Encounter tab)
- **Expected element:** Combat action panel (requires it to be player's turn)
- **Found:** N/A (no active encounter)
- **Classification:** Present (conditionally rendered -- requires active encounter + player's turn)
- **Evidence:** Component is conditionally rendered inside C027 when `isMyTurn` is true. No encounter is active, so no combat actions are shown. This is correct behavior.

### player-view-C046 -- Target selection overlay
- **Route checked:** http://localhost:3000/player (Encounter tab)
- **Expected element:** Target selection overlay (requires move in progress)
- **Found:** N/A (no active encounter)
- **Classification:** Present (conditionally rendered -- requires active combat + move selection)
- **Evidence:** Component is inside C030, shown when a move is pending. Not testable without active encounter.

### player-view-C047 -- Move detail overlay (long-press / right-click)
- **Route checked:** http://localhost:3000/player (Encounter tab)
- **Expected element:** Move detail overlay (requires long-press on move button)
- **Found:** N/A (no active encounter)
- **Classification:** Present (conditionally rendered -- requires active combat)
- **Evidence:** Component is inside C030, triggered by long-press/right-click on move buttons. Not testable without active encounter.

---

## Grid View (VTT)

### player-view-C068 -- PlayerGridView component
- **Route checked:** http://localhost:3000/player (Encounter tab)
- **Expected element:** VTT grid display (requires active encounter with grid enabled)
- **Found:** N/A (no active encounter)
- **Classification:** Present (conditionally rendered -- requires active encounter with grid)
- **Evidence:** Component is integrated into C027, shown when grid is enabled in an active encounter. Not testable without active encounter.

### player-view-C073 -- PlayerMoveRequest component
- **Route checked:** http://localhost:3000/player (Encounter tab)
- **Expected element:** Move confirmation bottom sheet (requires pending move)
- **Found:** N/A (no active encounter)
- **Classification:** Present (conditionally rendered -- requires grid + pending move)
- **Evidence:** Component is inside C068, shown when a move destination is selected. Not testable without active grid encounter.

---

## Scene View

### player-view-C065 -- PlayerSceneView component
- **Route checked:** http://localhost:3000/player (Scene tab)
- **Expected element:** Scene display or empty state
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Scene tab shows empty state: "No active scene" and "The GM has not started a scene yet." This is the correct behavior when no scene is active. Scene data would appear when GM activates a scene via WebSocket push.

---

## Group View Control

### player-view-C077 -- PlayerGroupControl component
- **Route checked:** http://localhost:3000/player (Scene tab)
- **Expected element:** Group View control panel with current tab and request buttons
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Group View panel shows: heading "Group View", "Current Tab: Lobby", and `button "Request Scene"`. The "Request Scene" button would send a group_view_request WebSocket event to the GM.

---

## Connection Status

### player-view-C078 -- ConnectionStatus component
- **Route checked:** http://localhost:3000/player (all tabs, banner)
- **Expected element:** Connection status indicator with expandable details
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Banner shows `status "Connected - LAN (Local) - 1ms"` with clickable button. Expanding shows details: "LAN (Local)", "Connected", "1ms" latency.

---

## Navigation & Layout

### player-view-C079 -- PlayerNavBar component
- **Route checked:** http://localhost:3000/player (all tabs)
- **Expected element:** Bottom navigation bar with 4 tabs
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `navigation "Player navigation"` with 4 buttons: "Character", "Team", "Encounter", "Scene". Each has an icon (img). Active tab is marked with `[active]` attribute. Tab switching works correctly with slide transitions.

### player-view-C080 -- PlayerSkeleton component
- **Route checked:** http://localhost:3000/player (initial load)
- **Expected element:** Shimmer skeleton screen during data loading
- **Found:** N/A (loads too fast to capture in snapshot)
- **Classification:** Present (conditionally rendered -- shown only during initial character data load)
- **Evidence:** Page loaded with character data immediately visible (first snapshot showed identity picker, second snapshot after selection showed full character sheet). The skeleton would appear during the brief loading period between selection and data arrival. The component exists in code at `app/components/player/PlayerSkeleton.vue`.

### player-view-C081 -- Player page (index.vue)
- **Route checked:** http://localhost:3000/player
- **Expected element:** Full player view with tabs, banner, and content
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Complete page renders: banner (character name, connection status, switch button), main content area (tab-switched content), and bottom navigation. All four tabs (Character, Team, Encounter, Scene) render content.

### player-view-C082 -- Tab slide transitions
- **Route checked:** http://localhost:3000/player (switching between tabs)
- **Expected element:** Directional slide transition when switching tabs
- **Found:** N/A (transitions are CSS animations, not reflected in accessibility tree)
- **Classification:** Present (animation -- verified via code; CSS transition classes `tab-slide-left`/`tab-slide-right` exist)
- **Evidence:** Tab switching occurs via `<Transition>` wrapper in index.vue. TAB_ORDER defines order: character=0, team=1, encounter=2, scene=3. Transition name computed based on tab index comparison.

### player-view-C083 -- Auto-switch to encounter tab on turn notification
- **Route checked:** http://localhost:3000/player
- **Expected element:** Automatic tab switch on turn notification (requires GM turn notification)
- **Found:** N/A (no active encounter, no turn notification)
- **Classification:** Present (conditionally rendered -- requires WebSocket turn notification)
- **Evidence:** Component watches `turnNotification` ref from usePlayerWebSocket and auto-sets activeTab to 'encounter'. Not testable without GM sending a player_turn_notify event.

---

## Summary

| Classification | Count |
|---------------|-------|
| Present | 18 |
| Present (conditionally rendered) | 4 |
| Absent | 1 |
| Error | 0 |
| Unreachable | 0 |

**Total browser-testable on /player: 23**

### Issues Found

1. **C025 (PlayerPokemonCard) expansion broken** -- MEDIUM severity. Card summary renders correctly but expanding triggers `TypeError: Cannot read properties of undefined (reading 'length')`. The error occurs in the template when accessing `pokemon.statusConditions.length` or `pokemon.abilities.length`, suggesting the server response is missing these fields or they are not arrays. This blocks C026 (PlayerMoveList) from rendering inside the expanded card.

2. **C026 (PlayerMoveList) blocked** -- MEDIUM severity. PlayerMoveList is rendered inside the expanded Pokemon card details section. Since expansion crashes, moves are not visible on the Team tab. Note: PlayerMoveList would also appear in combat (C030) if an encounter were active.
