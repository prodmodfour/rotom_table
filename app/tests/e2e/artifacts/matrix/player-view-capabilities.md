---
domain: player-view
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 89
files_read: 30
---

# App Capabilities: Player View

> First-time capability catalog for the player-view domain.
> Covers identity management, character sheet display, Pokemon team viewing, combat actions,
> encounter participation, scene viewing, WebSocket synchronization, grid interaction,
> export/import, haptic feedback, group view control, and connection status.

---

## Identity Management

### player-view-C001
- **name:** PlayerIdentityPicker component
- **type:** component
- **location:** `app/components/player/PlayerIdentityPicker.vue`
- **game_concept:** Player character selection
- **description:** Full-screen overlay that lists available player characters (fetched via GET /api/characters/players). Shows name, level, trainer classes, and up to 6 Pokemon sprites per character. Emits `select` event with characterId and characterName.
- **inputs:** None (auto-fetches on mount)
- **outputs:** Emits `select(characterId, characterName)` to parent
- **accessible_from:** player

### player-view-C002
- **name:** usePlayerIdentity composable
- **type:** composable-function
- **location:** `app/composables/usePlayerIdentity.ts`
- **game_concept:** Player identity persistence and data loading
- **description:** Wraps the playerIdentity store with localStorage persistence and server data fetching. Provides restoreIdentity (loads from localStorage on startup), selectCharacter (saves identity and fetches character data), clearIdentity (removes from localStorage), and refreshCharacterData (re-fetches from server).
- **inputs:** characterId, characterName (for selection)
- **outputs:** identity, character (HumanCharacter), pokemon (Pokemon[]), isIdentified, loading, error
- **accessible_from:** player

### player-view-C003
- **name:** usePlayerIdentity.restoreIdentity
- **type:** composable-function
- **location:** `app/composables/usePlayerIdentity.ts` — restoreIdentity()
- **game_concept:** Session persistence across page reloads
- **description:** Reads stored identity from localStorage (key: 'ptu_player_identity'), sets it in the store, and fetches fresh character data from the server. Returns true if identity was successfully restored.
- **inputs:** None (reads from localStorage)
- **outputs:** boolean (whether identity was restored)
- **accessible_from:** player

### player-view-C004
- **name:** usePlayerIdentity.selectCharacter
- **type:** composable-function
- **location:** `app/composables/usePlayerIdentity.ts` — selectCharacter()
- **game_concept:** Player choosing their character
- **description:** Persists the selected characterId and characterName to localStorage with a timestamp, sets identity in store, and fetches full character + Pokemon data from the server via GET /api/characters/:id/player-view.
- **inputs:** characterId: string, characterName: string
- **outputs:** void (populates store with character and pokemon data)
- **accessible_from:** player

### player-view-C005
- **name:** usePlayerIdentity.refreshCharacterData
- **type:** composable-function
- **location:** `app/composables/usePlayerIdentity.ts` — refreshCharacterData()
- **game_concept:** Character data refresh after server-side changes
- **description:** Re-fetches the player's character and Pokemon data from GET /api/characters/:id/player-view. Called on identity restore, character selection, WebSocket character_update events, and reconnection recovery.
- **inputs:** None (uses store's characterId)
- **outputs:** void (updates store with fresh data)
- **accessible_from:** player

### player-view-C006
- **name:** usePlayerIdentity.clearIdentity
- **type:** composable-function
- **location:** `app/composables/usePlayerIdentity.ts` — clearIdentity()
- **game_concept:** Switching to a different character
- **description:** Removes stored identity from localStorage and resets all state in the playerIdentity store (characterId, character, pokemon, error).
- **inputs:** None
- **outputs:** void
- **accessible_from:** player

### player-view-C007
- **name:** playerIdentity store
- **type:** store-action
- **location:** `app/stores/playerIdentity.ts`
- **game_concept:** Player identity state management
- **description:** Pinia store holding the player's selected characterId, characterName, full HumanCharacter object, Pokemon array, loading state, and error state. Provides actions: setIdentity, setCharacterData, setLoading, setError, clearIdentity. Provides getters: isIdentified, activePokemonId, activePokemon, pokemonIds.
- **inputs:** characterId, characterName, character, pokemon
- **outputs:** Reactive state for all player view components
- **accessible_from:** player

### player-view-C008
- **name:** playerIdentity.isIdentified getter
- **type:** store-getter
- **location:** `app/stores/playerIdentity.ts` — isIdentified
- **game_concept:** Whether the player has selected a character
- **description:** Returns true when characterId is not null. Used to toggle between the identity picker overlay and the main player view.
- **inputs:** Store state (characterId)
- **outputs:** boolean
- **accessible_from:** player

### player-view-C009
- **name:** playerIdentity.activePokemon getter
- **type:** store-getter
- **location:** `app/stores/playerIdentity.ts` — activePokemon
- **game_concept:** Currently active Pokemon on the trainer's team
- **description:** Returns the Pokemon object matching the character's activePokemonId, or null if none is set. Used to highlight the active Pokemon in the team list.
- **inputs:** Store state (character.activePokemonId, pokemon[])
- **outputs:** Pokemon | null
- **accessible_from:** player

### player-view-C010
- **name:** playerIdentity.pokemonIds getter
- **type:** store-getter
- **location:** `app/stores/playerIdentity.ts` — pokemonIds
- **game_concept:** IDs of all player's Pokemon
- **description:** Returns an array of Pokemon IDs for the player's team. Used for ownership detection in combat, fog of war visibility, and character_update event filtering.
- **inputs:** Store state (pokemon[])
- **outputs:** string[]
- **accessible_from:** player

---

## Player View API Endpoints

### player-view-C011
- **name:** GET /api/characters/:id/player-view
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/player-view.get.ts`
- **game_concept:** Player character data loading
- **description:** Returns the full character (serialized) with all linked Pokemon in a single response. Used by the Player View to populate the character sheet and Pokemon team tabs. Includes all stats, skills, features, edges, equipment, inventory, status conditions, and Pokemon details.
- **inputs:** characterId (route param)
- **outputs:** { success, data: { character: HumanCharacter, pokemon: Pokemon[] } }
- **accessible_from:** player, gm (technically callable)

### player-view-C012
- **name:** GET /api/characters/players
- **type:** api-endpoint
- **location:** `app/server/api/characters/players.get.ts`
- **game_concept:** Player character listing for identity picker
- **description:** Returns all characters with characterType='player'. Used by the PlayerIdentityPicker to list available characters. Includes id, name, level, trainerClasses, and linked pokemon (id, species, nickname).
- **inputs:** None
- **outputs:** { success, data: PlayerSummary[] }
- **accessible_from:** player

### player-view-C013
- **name:** GET /api/player/export/:characterId
- **type:** api-endpoint
- **location:** `app/server/api/player/export/[characterId].get.ts`
- **game_concept:** Character data export for offline portability
- **description:** Exports a full character with all owned Pokemon as a JSON blob. Includes metadata (exportVersion, exportedAt, appVersion) for import validation. Character data is fully serialized via serializeCharacter. Pokemon data is fully serialized via serializePokemon.
- **inputs:** characterId (route param)
- **outputs:** { success, data: { exportVersion, exportedAt, appVersion, character, pokemon[] } }
- **accessible_from:** player

### player-view-C014
- **name:** POST /api/player/import/:characterId
- **type:** api-endpoint
- **location:** `app/server/api/player/import/[characterId].post.ts`
- **game_concept:** Character data import with conflict detection
- **description:** Accepts an exported JSON payload and merges safe offline edits. Only updates player-editable fields: character (background, personality, goals, notes) and pokemon (nicknames, held items, move order). Performs conflict detection — if server updatedAt is newer than exportedAt, differing fields are flagged as conflicts (server wins). All updates are applied in a single Prisma transaction. Validated with Zod schema.
- **inputs:** characterId (route param), import payload (exportVersion, exportedAt, character, pokemon[])
- **outputs:** { success, data: { characterFieldsUpdated, pokemonUpdated, conflicts[], hasConflicts } }
- **accessible_from:** player

### player-view-C015
- **name:** POST /api/player/action-request
- **type:** api-endpoint
- **location:** `app/server/api/player/action-request.post.ts`
- **game_concept:** REST fallback for player combat action requests
- **description:** Forwards player action requests to the GM via server-side WebSocket when the player's WebSocket is momentarily disconnected. Registers requestId -> playerId in the shared pendingRequests map for response routing. Iterates over all GM peers and sends the player_action event.
- **inputs:** { playerId, playerName, action, requestId, ...action-specific fields }
- **outputs:** { success, data: { requestId, forwarded } } or error if no GM connected
- **accessible_from:** player

### player-view-C016
- **name:** GET /api/scenes/active
- **type:** api-endpoint
- **location:** `app/server/api/scenes/active.get.ts`
- **game_concept:** Active scene retrieval for player scene view
- **description:** Returns the currently active scene (if any) with characters, pokemon, and groups. Used by the player scene composable as a REST fallback for scene data when WebSocket is unavailable. Enriches characters with isPlayerCharacter flag and pokemon with ownerId.
- **inputs:** None
- **outputs:** { success, data: Scene | null }
- **accessible_from:** player, group, gm

---

## Character Sheet Display

### player-view-C017
- **name:** PlayerCharacterSheet component
- **type:** component
- **location:** `app/components/player/PlayerCharacterSheet.vue`
- **game_concept:** Trainer character sheet (read-only)
- **description:** Displays the player's character sheet with collapsible sections: header (name, level, classes, HP bar), stats grid (6 stats with stage modifiers), combat info (evasions, AP, injuries, temp HP, status conditions), skills (alphabetically sorted with rank coloring), features & edges (tag lists), equipment (6 slots), and inventory (items with quantities and money). Includes export/import buttons. Computes evasions using calculateEvasion with equipment bonuses.
- **inputs:** character: HumanCharacter prop
- **outputs:** Visual display; emits `imported` event when import completes
- **accessible_from:** player

### player-view-C018
- **name:** HP percent and color computation
- **type:** composable-function
- **location:** `app/components/player/PlayerCharacterSheet.vue` — hpPercent, hpColorClass computed
- **game_concept:** HP visualization with color-coded thresholds
- **description:** Computes HP percentage (0-100) and maps to color classes: healthy (>50%), warning (25-50%), critical (<25%). Used by the HP bar in the character sheet header.
- **inputs:** character.currentHp, character.maxHp
- **outputs:** hpPercent (number), hpColorClass (string)
- **accessible_from:** player

### player-view-C019
- **name:** Evasion computation with equipment bonuses
- **type:** composable-function
- **location:** `app/components/player/PlayerCharacterSheet.vue` — physEvasion, specEvasion, spdEvasion computed
- **game_concept:** PTU evasion calculation (Defense/SpDef/Speed based)
- **description:** Calculates physical, special, and speed evasion values using calculateEvasion() from damageCalculation utils. Incorporates equipment bonuses from computeEquipmentBonuses() (evasion bonus + stat bonuses from Focus items). Uses calculated stats per PTU rules (not base stats).
- **inputs:** character.stats, character.stageModifiers, character.equipment
- **outputs:** Three evasion numbers for display
- **accessible_from:** player

### player-view-C020
- **name:** Section collapse/expand toggle
- **type:** component
- **location:** `app/components/player/PlayerCharacterSheet.vue` — openSections reactive, toggleSection()
- **game_concept:** Mobile-friendly collapsible sheet sections
- **description:** Maintains collapse state for 6 sections (stats, combat, skills, features, equipment, inventory). Stats and combat default to open; others default to closed. Each section header is a button with aria-expanded and aria-controls attributes for accessibility.
- **inputs:** User click on section header
- **outputs:** Toggles section visibility
- **accessible_from:** player

---

## Export/Import

### player-view-C021
- **name:** useCharacterExportImport composable
- **type:** composable-function
- **location:** `app/composables/useCharacterExportImport.ts`
- **game_concept:** Character data portability (offline editing)
- **description:** Handles character JSON export (downloads as file) and import (uploads file, sends to server). Export creates a Blob, generates an object URL, and triggers a download link click. Import reads the file, parses JSON, sends to POST /api/player/import/:characterId, and displays results including conflict information. Provides operationResult with success/error state and conflict details.
- **inputs:** characterId (Ref<string>), characterName (Ref<string>)
- **outputs:** exporting, importing, operationResult, operationResultClass, handleExport, handleImportFile, clearOperationResult
- **accessible_from:** player

### player-view-C022
- **name:** useCharacterExportImport.handleExport
- **type:** composable-function
- **location:** `app/composables/useCharacterExportImport.ts` — handleExport()
- **game_concept:** Export character data as downloadable JSON file
- **description:** Fetches character data from GET /api/player/export/:characterId, creates a JSON Blob, generates a temporary download link, and triggers the download. File is named `{characterName}_export.json` with non-alphanumeric characters replaced by underscores.
- **inputs:** None (uses characterId and characterName refs)
- **outputs:** Downloaded JSON file
- **accessible_from:** player

### player-view-C023
- **name:** useCharacterExportImport.handleImportFile
- **type:** composable-function
- **location:** `app/composables/useCharacterExportImport.ts` — handleImportFile()
- **game_concept:** Import character data from JSON file with conflict detection
- **description:** Reads a File object, parses as JSON, sends to POST /api/player/import/:characterId. Displays results including how many character fields and Pokemon were updated, and any conflicts where the server version was kept. Returns true if any fields were actually updated.
- **inputs:** File object from file input
- **outputs:** boolean (whether updates were applied); sets operationResult state
- **accessible_from:** player

---

## Pokemon Team Display

### player-view-C024
- **name:** PlayerPokemonTeam component
- **type:** component
- **location:** `app/components/player/PlayerPokemonTeam.vue`
- **game_concept:** Pokemon team roster display
- **description:** Container component for the Team tab. Renders a list of PlayerPokemonCard components for each Pokemon in the player's team. Shows an empty state with PawPrint icon when no Pokemon exist. Highlights the active Pokemon via the activePokemonId prop.
- **inputs:** pokemon: Pokemon[], activePokemonId?: string
- **outputs:** Visual display of Pokemon cards
- **accessible_from:** player

### player-view-C025
- **name:** PlayerPokemonCard component
- **type:** component
- **location:** `app/components/player/PlayerPokemonCard.vue`
- **game_concept:** Individual Pokemon sheet (expandable card)
- **description:** Displays a Pokemon as a collapsible card. Summary shows sprite, nickname/species, types, level, HP bar. Expanded details show: status conditions, held item, stats grid (6 stats with stage modifiers), abilities (name + effect), moves (via PlayerMoveList), and capabilities (overland, swim, sky, burrow, levitate, jump, power). Active Pokemon is highlighted with a teal badge. Fainted Pokemon are dimmed.
- **inputs:** pokemon: Pokemon, isActive: boolean
- **outputs:** Visual display with expand/collapse interaction
- **accessible_from:** player

### player-view-C026
- **name:** PlayerMoveList component
- **type:** component
- **location:** `app/components/player/PlayerMoveList.vue`
- **game_concept:** Pokemon move list display (read-only reference)
- **description:** Displays a list of moves with type badge, name, damage class, DB, AC, and frequency. Each move is clickable to expand and show range and effect text. Used in the Team tab's Pokemon cards for reference (not combat execution).
- **inputs:** moves: Move[]
- **outputs:** Visual display with move detail expansion
- **accessible_from:** player

---

## Encounter View

### player-view-C027
- **name:** PlayerEncounterView component
- **type:** component
- **location:** `app/components/player/PlayerEncounterView.vue`
- **game_concept:** Player's encounter participation view
- **description:** Main encounter tab component. Shows encounter name, round number, current turn indicator, and combatants grouped by side (players, allies, enemies). Displays PlayerCombatActions panel when it is the player's turn. Integrates PlayerGridView when the grid is enabled. Shows a waiting state when no active encounter exists. Auto-scrolls to the current combatant when the turn changes.
- **inputs:** myCharacterId, myPokemonIds, send, onMessage (WebSocket functions)
- **outputs:** Visual display with combat action interaction
- **accessible_from:** player

### player-view-C028
- **name:** PlayerCombatantInfo component
- **type:** component
- **location:** `app/components/player/PlayerCombatantInfo.vue`
- **game_concept:** Combatant info card with information asymmetry
- **description:** Displays a combatant (trainer or Pokemon) with visibility rules based on ownership. Own combatants: exact HP, stats, moves, abilities, injuries. Allied combatants: exact HP, injuries (no stats/moves). Enemy combatants: percentage HP only (no exact values, no injuries). Shows sprite for Pokemon, avatar initial for trainers. Displays current turn badge, types, status conditions. Visual states for current turn (scarlet border), own (teal border), and fainted (dimmed).
- **inputs:** combatant: Combatant, isCurrentTurn, myCharacterId, myPokemonIds
- **outputs:** Visual display with information asymmetry applied
- **accessible_from:** player

### player-view-C029
- **name:** Combatant visibility rules
- **type:** composable-function
- **location:** `app/components/player/PlayerCombatantInfo.vue` — visibility computed
- **game_concept:** PTU information asymmetry (own/ally/enemy visibility levels)
- **description:** Determines what data fields are visible to the player for each combatant. isOwn: full data (showExactHp, showStats, showMoves, showAbilities, showInjuries). isAlly: exact HP + injuries only. isEnemy: percentage HP only (no exact values, no stats, no injuries).
- **inputs:** combatant.entityId, myCharacterId, myPokemonIds, combatant.side
- **outputs:** { showExactHp, showStats, showMoves, showAbilities, showInjuries }
- **accessible_from:** player

---

## Combat Actions

### player-view-C030
- **name:** PlayerCombatActions component
- **type:** component
- **location:** `app/components/player/PlayerCombatActions.vue`
- **game_concept:** Player combat action panel (turn-based)
- **description:** Full combat action interface shown when it is the player's turn. Includes: turn state banner (STD/SHF/SWF action pips), league battle phase indicator, cannot-command warning, move buttons with type/DB/AC/frequency, target selection overlay, core actions (Shift, Struggle, Pass Turn), request actions requiring GM approval (Use Item, Switch Pokemon, Maneuver), expandable panels for items/switch/maneuvers, pass turn confirmation dialog, move detail overlay (long-press/right-click), and toast notifications for action results.
- **inputs:** Uses usePlayerCombat() composable for all combat state and actions
- **outputs:** Sends combat actions through encounterStore and WebSocket
- **accessible_from:** player

### player-view-C031
- **name:** usePlayerCombat composable
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts`
- **game_concept:** Player combat logic and action execution
- **description:** Central combat composable for the player view. Provides turn detection (isMyTurn), active combatant tracking, league battle phase awareness, turn state (action pip tracking), move availability with frequency exhaustion, direct actions (executeMove, useShiftAction, useStruggle, passTurn), and GM-requested actions (requestUseItem, requestSwitchPokemon, requestManeuver). Uses provide/inject for the shared WebSocket send function.
- **inputs:** encounterStore state, playerStore identity, WebSocket send (via inject)
- **outputs:** All combat state and action functions
- **accessible_from:** player

### player-view-C032
- **name:** usePlayerCombat.isMyTurn
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — isMyTurn computed
- **game_concept:** Turn detection for player
- **description:** Returns true when the current combatant's entityId matches the player's character ID or any of their Pokemon IDs. Drives the display of the combat action panel.
- **inputs:** encounterStore.currentCombatant, playerStore.character.id, playerStore.pokemon
- **outputs:** boolean
- **accessible_from:** player

### player-view-C033
- **name:** usePlayerCombat.isMoveExhausted
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — isMoveExhausted()
- **game_concept:** PTU move frequency tracking (At-Will, EOT, Scene, Daily, Static)
- **description:** Checks if a move has reached its frequency limit. Supports At-Will (never exhausted), EOT (can't use if used last turn), Scene/Scene x2/Scene x3 (per-scene usage tracking), Daily/Daily x2/Daily x3 (per-day usage tracking), and Static (always exhausted — passive only). Returns an object with exhausted boolean and reason string.
- **inputs:** move: Move (with frequency, lastTurnUsed, usedThisScene, usedToday fields)
- **outputs:** { exhausted: boolean, reason: string }
- **accessible_from:** player

### player-view-C034
- **name:** usePlayerCombat.executeMove
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — executeMove()
- **game_concept:** PTU move execution in combat (direct action)
- **description:** Executes a Pokemon move against selected targets. Calls encounterStore.executeMove with the combatant ID, move ID, and target IDs. This is a direct action (no GM approval needed). Throws error if it is not the player's turn.
- **inputs:** moveId: string, targetIds: string[]
- **outputs:** void (side effect: server API call via encounterStore)
- **accessible_from:** player

### player-view-C035
- **name:** usePlayerCombat.useShiftAction
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — useShiftAction()
- **game_concept:** PTU Shift action (move 1 meter)
- **description:** Uses the combatant's Shift action, marking it as used for the turn. Direct action — calls encounterStore.useAction with 'shift'. Throws error if not the player's turn.
- **inputs:** None
- **outputs:** void (side effect: marks shift action used)
- **accessible_from:** player

### player-view-C036
- **name:** usePlayerCombat.useStruggle
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — useStruggle()
- **game_concept:** PTU Struggle attack (Normal Type, AC 4, DB 4, Melee, Physical, no STAB)
- **description:** Executes the Struggle attack as a standard action alternative. Calls encounterStore.executeMove with the special 'struggle' moveId and target IDs. Throws error if not the player's turn.
- **inputs:** targetIds: string[]
- **outputs:** void (side effect: server API call)
- **accessible_from:** player

### player-view-C037
- **name:** usePlayerCombat.passTurn
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — passTurn()
- **game_concept:** End combatant's turn and advance to next
- **description:** Ends the player's turn and advances to the next combatant. Direct action — calls encounterStore.nextTurn(). Throws error if not the player's turn.
- **inputs:** None
- **outputs:** void (side effect: advances encounter turn)
- **accessible_from:** player

### player-view-C038
- **name:** usePlayerCombat.requestUseItem
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — requestUseItem()
- **game_concept:** Request to use an inventory item (requires GM approval)
- **description:** Sends a player_action WebSocket message with action 'use_item', itemId, and itemName. Includes a generated requestId for response tracking. The GM sees the request and can accept/reject it.
- **inputs:** itemId: string, itemName: string
- **outputs:** void (side effect: WebSocket message sent)
- **accessible_from:** player

### player-view-C039
- **name:** usePlayerCombat.requestSwitchPokemon
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — requestSwitchPokemon()
- **game_concept:** Request to switch active Pokemon (requires GM approval)
- **description:** Sends a player_action WebSocket message with action 'switch_pokemon' and pokemonId. Requires GM approval before the switch is executed.
- **inputs:** pokemonId: string
- **outputs:** void (side effect: WebSocket message sent)
- **accessible_from:** player

### player-view-C040
- **name:** usePlayerCombat.requestManeuver
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — requestManeuver()
- **game_concept:** Request to perform a combat maneuver (requires GM approval)
- **description:** Sends a player_action WebSocket message with action 'maneuver', maneuverId, and maneuverName. PTU maneuvers (Push, Sprint, Trip, Grapple, Intercept, Take a Breather) require GM adjudication.
- **inputs:** maneuverId: string, maneuverName: string
- **outputs:** void (side effect: WebSocket message sent)
- **accessible_from:** player

### player-view-C041
- **name:** usePlayerCombat.validTargets
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — validTargets computed
- **game_concept:** Target selection for moves and attacks
- **description:** Returns all non-fainted combatants in the encounter as valid targets. Filters out combatants with currentHp <= 0. Used by the target selection overlay in PlayerCombatActions.
- **inputs:** encounterStore.encounter.combatants
- **outputs:** Combatant[] (non-fainted only)
- **accessible_from:** player

### player-view-C042
- **name:** usePlayerCombat.switchablePokemon
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — switchablePokemon computed
- **game_concept:** Available Pokemon for switch-in
- **description:** Returns the player's non-fainted Pokemon excluding the currently active combatant's entity. Used by the Switch Pokemon panel.
- **inputs:** playerStore.pokemon, myActiveCombatant.entityId
- **outputs:** Pokemon[] (non-fainted, not currently active)
- **accessible_from:** player

### player-view-C043
- **name:** usePlayerCombat.trainerInventory
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — trainerInventory computed
- **game_concept:** Available items for use in combat
- **description:** Returns the trainer's inventory items with quantity > 0. Used by the Use Item panel.
- **inputs:** playerStore.character.inventory
- **outputs:** InventoryItem[] (quantity > 0 only)
- **accessible_from:** player

### player-view-C044
- **name:** usePlayerCombat.canBeCommanded
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — canBeCommanded computed
- **game_concept:** PTU league battle newly-switched Pokemon restriction
- **description:** In league battles, a newly switched-in Pokemon cannot be commanded on the turn it enters (PTU p.227). This computed returns false in that case. Shift and pass actions remain available. Uses turnState.canBeCommanded field.
- **inputs:** turnState from active combatant
- **outputs:** boolean
- **accessible_from:** player

### player-view-C045
- **name:** usePlayerCombat.isLeagueBattle / isTrainerPhase / isPokemonPhase
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — league battle computed properties
- **game_concept:** PTU League Battle vs Full Contact battle mode awareness
- **description:** Detects whether the encounter is a league battle (trainers and Pokemon act in separate phases) and which phase is currently active (trainer_declaration/trainer_resolution or pokemon). Used to show the phase indicator and restrict certain actions.
- **inputs:** encounterStore.isLeagueBattle, encounterStore.currentPhase
- **outputs:** boolean values for each phase check
- **accessible_from:** player

### player-view-C046
- **name:** Target selection overlay
- **type:** component
- **location:** `app/components/player/PlayerCombatActions.vue` — target-selector template section
- **game_concept:** Multi-target selection for move execution
- **description:** Overlay that shows all valid (non-fainted) targets grouped by side. Player can select multiple targets by toggling buttons. Shows target name and side label. Confirm button sends the move execution with selected target IDs. Cancel button dismisses the overlay.
- **inputs:** validTargets (from usePlayerCombat), pendingMoveId, pendingAction
- **outputs:** Calls executeMove or useStruggle with selected targetIds
- **accessible_from:** player

### player-view-C047
- **name:** Move detail overlay (long-press / right-click)
- **type:** component
- **location:** `app/components/player/PlayerCombatActions.vue` — move-detail-overlay section
- **game_concept:** Quick reference for move details during combat
- **description:** Shows full move details (type, name, DB, AC, frequency, damage class, range, effect) in an overlay triggered by long-press (500ms touch) or right-click on a move button. Dismissible by clicking outside or the close button.
- **inputs:** Move object (from long-press or context menu)
- **outputs:** Visual overlay display
- **accessible_from:** player

---

## WebSocket Communication

### player-view-C048
- **name:** usePlayerWebSocket composable
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts`
- **game_concept:** Player-specific WebSocket orchestration
- **description:** Orchestrates all player-specific WebSocket behavior. Auto-identifies as 'player' when connected with a characterId. Handles scene_sync, scene_deactivated, character_update, damage_applied, move_executed, player_action_ack, player_turn_notify, and granular scene events. Manages pending action request tracking with 60s timeout. Provides sendAction with requestId tracking and promise-based acknowledgment.
- **inputs:** Base useWebSocket composable, playerStore, encounterStore, usePlayerScene, useHapticFeedback
- **outputs:** Connection state, activeScene, sendAction, pendingActionCount, lastActionAck, turnNotification
- **accessible_from:** player

### player-view-C049
- **name:** usePlayerWebSocket.sendAction
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — sendAction()
- **game_concept:** Tracked action request with promise-based acknowledgment
- **description:** Sends a player action request with a generated requestId and returns a Promise that resolves when the GM acknowledges (player_action_ack). Pending actions are tracked in a Map with automatic 60-second timeout. If the GM doesn't respond within 60 seconds, the promise rejects.
- **inputs:** Action object (minus requestId/playerId/playerName which are auto-filled)
- **outputs:** Promise<PlayerActionAck>
- **accessible_from:** player

### player-view-C050
- **name:** usePlayerWebSocket.handleActionAck
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleActionAck()
- **game_concept:** GM acknowledgment processing
- **description:** Handles incoming player_action_ack events. Sets lastActionAck for toast display (auto-clears after 4 seconds). Resolves the matching pending action promise. Removes the entry from the pendingActions map.
- **inputs:** PlayerActionAck payload from WebSocket
- **outputs:** Updates lastActionAck ref, resolves pending promise
- **accessible_from:** player

### player-view-C051
- **name:** usePlayerWebSocket.handleTurnNotify
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleTurnNotify()
- **game_concept:** Turn notification with haptic feedback
- **description:** Handles player_turn_notify events from the GM. Sets turnNotification state (auto-clears after 5 seconds). Triggers haptic vibration via vibrateOnTurnStart(). The player page watches turnNotification and auto-switches to the Encounter tab.
- **inputs:** PlayerTurnNotification payload from WebSocket
- **outputs:** Sets turnNotification ref, triggers vibration
- **accessible_from:** player

### player-view-C052
- **name:** usePlayerWebSocket.handleDamageApplied
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleDamageApplied()
- **game_concept:** Haptic feedback when player's entity takes damage
- **description:** Handles damage_applied WebSocket events. Checks if the damaged entity (targetId) matches the player's character or any of their Pokemon. If so, triggers vibrateOnDamageTaken() haptic feedback.
- **inputs:** { targetId } from WebSocket event
- **outputs:** Triggers vibration if player's entity was damaged
- **accessible_from:** player

### player-view-C053
- **name:** usePlayerWebSocket.handleMoveExecuted
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleMoveExecuted()
- **game_concept:** Haptic feedback when player's entity executes a move
- **description:** Handles move_executed WebSocket events. Checks if the executing entity (entityId) matches the player's character or any of their Pokemon. If so, triggers vibrateOnMoveExecute() haptic feedback.
- **inputs:** { combatantId, entityId } from WebSocket event
- **outputs:** Triggers vibration if player's entity executed
- **accessible_from:** player

### player-view-C054
- **name:** usePlayerWebSocket.handleCharacterUpdate
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleCharacterUpdate()
- **game_concept:** Real-time character data synchronization
- **description:** Handles character_update WebSocket events. If the updated entity ID matches the player's character or any Pokemon, triggers a full refreshCharacterData() to re-fetch from the server. Ensures the player view stays in sync with GM-side changes (HP, status, stats, etc.).
- **inputs:** { id } from WebSocket event
- **outputs:** Triggers refreshCharacterData() if relevant
- **accessible_from:** player

### player-view-C055
- **name:** Scene event handling (granular)
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handlePlayerMessage switch cases
- **game_concept:** Real-time scene synchronization for player
- **description:** Handles 10 granular scene-related WebSocket events: scene_sync (applies WebSocket payload), scene_deactivated (clears scene), scene_activated (fetches via REST), scene_update, scene_character_added/removed, scene_pokemon_added/removed, scene_group_created/updated/deleted, scene_positions_updated. All granular events trigger fetchActiveScene() REST fallback rather than incremental patching for simplicity.
- **inputs:** Various WebSocket event payloads
- **outputs:** Updates activeScene ref via REST fetch or direct mapping
- **accessible_from:** player

---

## WebSocket Events (Player-Specific)

### player-view-C056
- **name:** identify (player role)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'identify'
- **game_concept:** Player WebSocket session identification
- **description:** Client sends identify with role='player', optional encounterId, and characterId. Server stores the role and characterId on the peer info. Triggers sending active scene and tab state to the player.
- **inputs:** { role: 'player', encounterId?, characterId }
- **outputs:** Server stores identity; sends scene_sync and tab_state
- **accessible_from:** player

### player-view-C057
- **name:** player_action (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_action'
- **game_concept:** Player combat action forwarding to GM
- **description:** Player or group client submits an action request (use_item, switch_pokemon, maneuver, etc.). Server registers requestId -> playerId in pendingRequests, then forwards the event to all GM peers. Requires the client to be in an encounter.
- **inputs:** PlayerActionRequest (requestId, playerId, playerName, action, ...)
- **outputs:** Forwarded to GM peers
- **accessible_from:** player, group (when in encounter)

### player-view-C058
- **name:** player_action_ack (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_action_ack'
- **game_concept:** GM acknowledgment routing back to player
- **description:** GM sends an acknowledgment for a player action request. Server looks up the requestId in pendingRequests to find the originating player's characterId, then routes the ack to all player peers matching that characterId.
- **inputs:** { requestId, status, reason? } from GM
- **outputs:** Routed to originating player peer
- **accessible_from:** gm (sends), player (receives)

### player-view-C059
- **name:** player_turn_notify (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_turn_notify'
- **game_concept:** Turn notification routing to specific player
- **description:** GM sends a notification that a specific player's combatant's turn has begun. Server routes the event to all player peers matching the playerId in the payload.
- **inputs:** { playerId, combatantId, combatantName, combatantType, round, availableActions }
- **outputs:** Routed to specific player peer
- **accessible_from:** gm (sends), player (receives)

### player-view-C060
- **name:** player_move_request (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_move_request'
- **game_concept:** Player token movement request on VTT grid
- **description:** Player requests to move their token on the tactical grid. Server registers requestId in pendingRequests and forwards to GM peers. Requires the player to be in an encounter.
- **inputs:** PlayerMoveRequest (requestId, playerId, combatantId, fromPosition, toPosition, distance)
- **outputs:** Forwarded to GM peers
- **accessible_from:** player

### player-view-C061
- **name:** player_move_response (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_move_response'
- **game_concept:** GM response to player token movement
- **description:** GM responds to a player movement request with approved/rejected/modified status. Server routes the response to the originating player via pendingRequests lookup.
- **inputs:** PlayerMoveResponse (requestId, status, position?, reason?)
- **outputs:** Routed to originating player peer
- **accessible_from:** gm (sends), player (receives)

### player-view-C062
- **name:** group_view_request (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'group_view_request'
- **game_concept:** Player requesting Group View tab change
- **description:** Player requests a tab change on the shared Group View (TV/projector). Forwarded to GM for approval. Uses the same pending request pattern as other player actions.
- **inputs:** GroupViewRequest (requestId, playerId, playerName, requestType, tab?, sceneId?)
- **outputs:** Forwarded to GM peers
- **accessible_from:** player

### player-view-C063
- **name:** group_view_response (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'group_view_response'
- **game_concept:** GM response to Group View tab change request
- **description:** GM responds to a player's Group View change request with approved/rejected status. Routed to the originating player via pendingRequests lookup.
- **inputs:** GroupViewResponse (requestId, status, reason?)
- **outputs:** Routed to originating player peer
- **accessible_from:** gm (sends), player (receives)

### player-view-C064
- **name:** scene_request (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'scene_request'
- **game_concept:** Player requesting active scene data
- **description:** Player requests the current active scene. Server queries the database for the active scene and sends a scene_sync event back to the requesting player. Only handled for player-role clients.
- **inputs:** None
- **outputs:** scene_sync event sent back to requesting player
- **accessible_from:** player

---

## Scene View

### player-view-C065
- **name:** PlayerSceneView component
- **type:** component
- **location:** `app/components/player/PlayerSceneView.vue`
- **game_concept:** Active scene display for players
- **description:** Displays the GM's active scene from the player's perspective. Shows scene name, weather badge, location image or name, description, characters present (with PC/NPC tags), Pokemon present (with species), and groups present. Shows an empty state when no scene is active. Receives scene data from the usePlayerScene composable via WebSocket push.
- **inputs:** scene: PlayerSceneData | null
- **outputs:** Visual scene display
- **accessible_from:** player

### player-view-C066
- **name:** usePlayerScene composable
- **type:** composable-function
- **location:** `app/composables/usePlayerScene.ts`
- **game_concept:** Player scene state management (WebSocket + REST fallback)
- **description:** Manages the player's view of the active scene. Handles scene_sync WebSocket events (maps payload to PlayerSceneData shape), scene deactivation (clears state), and provides a REST fallback via GET /api/scenes/active for reconnection recovery. Strips scene data to player-visible fields only (no terrains, modifiers, or GM metadata).
- **inputs:** SceneSyncPayload from WebSocket, or REST response from /api/scenes/active
- **outputs:** activeScene (readonly ref of PlayerSceneData | null)
- **accessible_from:** player

### player-view-C067
- **name:** PlayerSceneData type
- **type:** constant
- **location:** `app/composables/usePlayerScene.ts` — PlayerSceneData interface
- **game_concept:** Player-safe scene data shape
- **description:** Defines the shape of scene data visible to players: id, name, description, locationName, locationImage, weather, isActive, characters (id, name, isPlayerCharacter), pokemon (id, nickname, species, ownerId), groups (id, name). Excludes GM-only fields like terrains and modifiers.
- **inputs:** N/A (type definition)
- **outputs:** N/A (type definition)
- **accessible_from:** player

---

## Grid View (VTT)

### player-view-C068
- **name:** PlayerGridView component
- **type:** component
- **location:** `app/components/player/PlayerGridView.vue`
- **game_concept:** Player-mode VTT grid display
- **description:** Renders the tactical battle grid from the player's perspective. Uses the shared GridCanvas component in player mode. Shows fog-filtered tokens, pending move status bar, and move confirmation sheet. Handles cell clicks to set move targets and token selection (own tokens only). Calculates PTU diagonal distance for move requests. Auto-centers on the player's primary token on initial load.
- **inputs:** characterId, pokemonIds, send, onMessage (WebSocket functions)
- **outputs:** Visual grid with player-restricted interaction
- **accessible_from:** player

### player-view-C069
- **name:** usePlayerGridView composable
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts`
- **game_concept:** Player grid state management with fog and movement
- **description:** Manages player-specific grid state: token ownership detection, fog-filtered visible tokens, move request flow (select token -> tap destination -> confirm -> pending), pending move tracking with 30s timeout and server response handling, and information asymmetry levels (full/allied/enemy). Listens for player_move_response WebSocket events.
- **inputs:** characterId, pokemonIds, send, onMessage
- **outputs:** visibleTokens, isOwnCombatant, selectedCombatantId, moveConfirmTarget, pendingMove, selectToken, clearSelection, setMoveTarget, confirmMove, cancelMoveConfirm, primaryTokenPosition, getInfoLevel, ownCombatants
- **accessible_from:** player

### player-view-C070
- **name:** usePlayerGridView.visibleTokens
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts` — visibleTokens computed
- **game_concept:** Fog of war token visibility filtering
- **description:** Filters combatant tokens based on fog of war state. Own tokens (trainer + Pokemon) are always visible regardless of fog. Other tokens are only visible on 'revealed' cells; hidden and explored cells hide tokens. When fog is disabled, all tokens with positions are visible.
- **inputs:** encounterStore combatants, fogStore state, isOwnCombatant check
- **outputs:** TokenInfo[] (combatantId, position, size)
- **accessible_from:** player

### player-view-C071
- **name:** usePlayerGridView.confirmMove (move request)
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts` — confirmMove()
- **game_concept:** Player token movement request (GM approval required)
- **description:** Sends a player_move_request WebSocket event to the GM with requestId, playerId, combatantId, from/to positions, and distance. Sets pendingMove state for UI tracking. Auto-times out after 30 seconds if GM doesn't respond.
- **inputs:** Selected combatantId, moveConfirmTarget (position + distance)
- **outputs:** Sends WebSocket event; sets pendingMove ref
- **accessible_from:** player

### player-view-C072
- **name:** usePlayerGridView.getInfoLevel
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts` — getInfoLevel()
- **game_concept:** Information asymmetry for grid tokens
- **description:** Determines what level of information the player can see for a combatant on the grid: 'full' (own combatants — all data), 'allied' (same side — name + exact HP), 'enemy' (opponent — name + percentage HP).
- **inputs:** Combatant, characterId, pokemonIds
- **outputs:** 'full' | 'allied' | 'enemy'
- **accessible_from:** player

### player-view-C073
- **name:** PlayerMoveRequest component
- **type:** component
- **location:** `app/components/player/PlayerMoveRequest.vue`
- **game_concept:** Move confirmation sheet for grid token movement
- **description:** Bottom sheet overlay that shows the destination coordinates and distance for a pending move. Provides Confirm and Cancel buttons. Uses slide-up transition. Positioned above the player nav bar.
- **inputs:** visible, position (GridPosition), distance (number)
- **outputs:** Emits 'confirm' or 'cancel'
- **accessible_from:** player

---

## Reconnection & State Sync

### player-view-C074
- **name:** useStateSync composable
- **type:** composable-function
- **location:** `app/composables/useStateSync.ts`
- **game_concept:** Reconnect recovery for player view
- **description:** Automatically performs full state sync when the WebSocket reconnects after a disconnect. Sequence: (1) re-identify as player, (2) rejoin encounter, (3) request full encounter state via sync_request, (4) request active scene via scene_request, (5) request tab state via tab_sync_request, (6) re-fetch character data via REST. Includes a 5-second cooldown between syncs to avoid spamming. Distinguishes initial connect from reconnect.
- **inputs:** isConnected, send, identify, joinEncounter, refreshCharacterData
- **outputs:** isSyncing (boolean), performSync()
- **accessible_from:** player

### player-view-C075
- **name:** Encounter polling with backoff
- **type:** composable-function
- **location:** `app/pages/player/index.vue` — checkForActiveEncounter, polling logic
- **game_concept:** Active encounter detection for player
- **description:** Polls GET /api/encounters every 3 seconds to detect active encounters. When an active encounter is found, loads it into the encounterStore and joins the encounter room via WebSocket. Implements exponential backoff on failure (doubles interval after 5 consecutive failures, capped at 30 seconds). Resets to base interval on success after backoff.
- **inputs:** None (auto-runs on mount and after character selection)
- **outputs:** Side effects: loads encounter, identifies on WebSocket
- **accessible_from:** player

---

## Haptic Feedback

### player-view-C076
- **name:** useHapticFeedback composable
- **type:** composable-function
- **location:** `app/composables/useHapticFeedback.ts`
- **game_concept:** Mobile vibration feedback for combat events
- **description:** Provides predefined vibration patterns via the Vibration API for player events. Safely no-ops on browsers/devices without vibration support. Patterns: vibrateOnTurnStart (double-pulse: 200-100-200ms), vibrateOnMoveExecute (short: 100ms), vibrateOnDamageTaken (triple: 80-60-80-60-80ms), vibrateOnTap (light: 30ms).
- **inputs:** None
- **outputs:** isSupported, vibrate, vibrateOnTurnStart, vibrateOnMoveExecute, vibrateOnDamageTaken, vibrateOnTap
- **accessible_from:** player

---

## Group View Control

### player-view-C077
- **name:** PlayerGroupControl component
- **type:** component
- **location:** `app/components/player/PlayerGroupControl.vue`
- **game_concept:** Player requesting changes to the shared Group View (TV/projector)
- **description:** Allows a player to request tab changes on the shared Group View. Shows the current tab, request buttons (Request Scene / Request Lobby), pending state while waiting for GM, cooldown timer (30 seconds after each request), and response feedback (approved/rejected auto-dismisses after 3 seconds). Sends group_view_request WebSocket events and listens for group_view_response. Auto-times out requests after 30 seconds.
- **inputs:** currentTab, send, onMessage (WebSocket functions)
- **outputs:** Sends WebSocket events; visual feedback
- **accessible_from:** player

---

## Connection Status

### player-view-C078
- **name:** ConnectionStatus component
- **type:** component
- **location:** `app/components/player/ConnectionStatus.vue`
- **game_concept:** WebSocket connection health indicator
- **description:** Displays a colored dot indicating connection state (connected=green, reconnecting=yellow/pulsing, disconnected=red). Tappable to show details: connection type (LAN/Tunnel), state label, latency in ms, reconnect attempt counter, and retry button. Uses getConnectionType() utility to determine LAN vs tunnel. Click-outside dismisses details.
- **inputs:** isConnected, isReconnecting, reconnectAttempt, maxReconnectAttempts, latencyMs, lastError
- **outputs:** Emits 'retry' event; visual status display
- **accessible_from:** player

---

## Navigation & Layout

### player-view-C079
- **name:** PlayerNavBar component
- **type:** component
- **location:** `app/components/player/PlayerNavBar.vue`
- **game_concept:** Bottom tab navigation for player view
- **description:** Fixed bottom navigation bar with 4 tabs: Character (PhUser), Team (PhPawPrint), Encounter (PhSword), Scene (PhMapPin). Shows notification badge dot on Encounter tab when there is an active encounter or pending requests, and on Scene tab when a scene is active. Active tab is highlighted with scarlet color and icon glow. Includes 4K scaling and safe-area-inset-bottom for mobile notches.
- **inputs:** activeTab, hasActiveEncounter?, hasActiveScene?, hasPendingRequests?
- **outputs:** Emits 'change' with PlayerTab value
- **accessible_from:** player

### player-view-C080
- **name:** PlayerSkeleton component
- **type:** component
- **location:** `app/components/player/PlayerSkeleton.vue`
- **game_concept:** Loading skeleton screen for character data
- **description:** Shimmer-animated skeleton screen shown while character data is loading. Mimics the character sheet layout with placeholder shapes for avatar, name, HP bar, stats grid, combat info, and additional sections. Uses aria-busy="true" for accessibility.
- **inputs:** None
- **outputs:** Visual loading placeholder
- **accessible_from:** player

### player-view-C081
- **name:** Player page (index.vue)
- **type:** component
- **location:** `app/pages/player/index.vue`
- **game_concept:** Player view orchestrator page
- **description:** Main player page that orchestrates the entire player experience. Manages tab state (character/team/encounter/scene) with directional slide transitions. Integrates all subsystems: identity management, WebSocket connection, encounter polling, turn notifications, action acknowledgment toasts, reconnection recovery, and tab-based content switching. Provides the WebSocket send function to child components via provide/inject pattern.
- **inputs:** URL route (player layout)
- **outputs:** Full player view UI with all tabs
- **accessible_from:** player

### player-view-C082
- **name:** Tab slide transitions
- **type:** component
- **location:** `app/pages/player/index.vue` — tabTransitionName, TAB_ORDER
- **game_concept:** Mobile-like swipe-direction tab transitions
- **description:** Tracks tab order (character=0, team=1, encounter=2, scene=3) and sets transition direction based on whether the new tab index is higher (slide-left) or lower (slide-right) than the previous. Creates a natural mobile-like feel when switching between tabs.
- **inputs:** activeTab watcher
- **outputs:** tabTransitionName ('tab-slide-left' | 'tab-slide-right')
- **accessible_from:** player

### player-view-C083
- **name:** Auto-switch to encounter tab on turn notification
- **type:** component
- **location:** `app/pages/player/index.vue` — watch(turnNotification)
- **game_concept:** Automatic tab focus when player's turn begins
- **description:** Watches the turnNotification ref from usePlayerWebSocket. When a turn notification arrives, automatically switches the active tab to 'encounter' so the player immediately sees their combat action panel.
- **inputs:** turnNotification from usePlayerWebSocket
- **outputs:** Sets activeTab to 'encounter'
- **accessible_from:** player

---

## Utility Functions

### player-view-C084
- **name:** getConnectionType utility
- **type:** utility
- **location:** `app/utils/connectionType.ts`
- **game_concept:** Network topology detection
- **description:** Determines the connection type based on the current hostname: 'localhost' (127.0.0.1, ::1), 'lan' (192.168.x.x, 10.x.x.x, 172.16-31.x.x), or 'tunnel' (everything else — Cloudflare Tunnel, ngrok, etc.). Used by WebSocket reconnection logic and ConnectionStatus UI to adjust behavior and display.
- **inputs:** window.location.hostname
- **outputs:** 'localhost' | 'lan' | 'tunnel'
- **accessible_from:** player, group, gm

### player-view-C085
- **name:** QR code generator (generateQrSvg)
- **type:** utility
- **location:** `app/utils/qrcode.ts`
- **game_concept:** QR code for player view URL sharing
- **description:** Pure TypeScript QR code generator that outputs SVG strings. Implements ISO/IEC 18004 QR Code specification (versions 1-6, EC level L). Used to share the player view URL with players (e.g., for LAN access). Includes encodeQR (returns module matrix) and generateQrSvg (returns SVG string with configurable module size, quiet zone, colors).
- **inputs:** text: string, options: QrSvgOptions (moduleSize, quietZone, foreground, background)
- **outputs:** SVG string
- **accessible_from:** player, gm

---

## Server-Side Utilities

### player-view-C086
- **name:** pendingRequests utility
- **type:** service-function
- **location:** `app/server/utils/pendingRequests.ts`
- **game_concept:** Request-response routing for player-GM communication
- **description:** Shared Map storing requestId -> characterId for routing GM acknowledgments back to the originating player. Used by both the WebSocket handler and the REST fallback endpoint. Entries auto-expire after 60 seconds via periodic cleanup (every 30 seconds). Provides registerPendingRequest, consumePendingRequest (single-use), and getPendingRequest.
- **inputs:** requestId, characterId
- **outputs:** characterId lookup for response routing
- **accessible_from:** api-only (server-side utility)

---

## Types

### player-view-C087
- **name:** PlayerTab type
- **type:** constant
- **location:** `app/types/player.ts`
- **game_concept:** Player navigation tab identifiers
- **description:** Union type defining the available tabs in the player bottom navigation: 'character' | 'team' | 'encounter' | 'scene'. Used by PlayerNavBar and the player page for tab state management.
- **inputs:** N/A (type definition)
- **outputs:** N/A (type definition)
- **accessible_from:** player

### player-view-C088
- **name:** Player-sync types (full protocol)
- **type:** constant
- **location:** `app/types/player-sync.ts`
- **game_concept:** Player-GM WebSocket communication protocol
- **description:** Defines all WebSocket message types for player-GM communication: PlayerActionType (8 action types), PlayerActionRequest (with requestId tracking), PlayerActionAck (accepted/rejected/pending), PlayerTurnNotification (with available actions), PlayerMoveRequest (token movement), PlayerMoveResponse (approved/rejected/modified), GroupViewRequest (tab change), GroupViewResponse, SceneSyncPayload (player-safe scene shape).
- **inputs:** N/A (type definitions)
- **outputs:** N/A (type definitions)
- **accessible_from:** player, gm

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
