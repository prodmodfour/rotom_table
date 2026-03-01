# App Surface Map

Testable features, routes, and API endpoints for the PTU Session Helper.

## Dev Server

- **Port:** 3001 (configurable via `TEST_PORT` env var)
- **Start:** `cd app && npm run dev`
- **Seed DB:** `cd app && npx prisma db seed`
- **Reset DB:** `cd app && npx prisma migrate reset` (destructive — drops all data)

## Page Routes by View

### GM View (`/gm`) — Full control interface

| Route | Page File | Purpose |
|-------|-----------|---------|
| `/gm` | `pages/gm/index.vue` | Encounter management — create, run, control encounters (VTT grid + list) |
| `/gm/sheets` | `pages/gm/sheets.vue` | Character/Pokemon library — browse, filter, search, grouped by location |
| `/gm/create` | `pages/gm/create.vue` | Create Human Character or Pokemon |
| `/gm/characters/:id` | `pages/gm/characters/[id].vue` | Human character sheet — Stats, Classes, Skills, Equipment, Pokemon, Healing, Notes tabs |
| `/gm/pokemon/:id` | `pages/gm/pokemon/[id].vue` | Pokemon sheet — Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes tabs |
| `/gm/encounters` | `pages/gm/encounters.vue` | Encounter template library — CRUD templates |
| `/gm/encounter-tables` | `pages/gm/encounter-tables.vue` | Encounter tables list — create, import/export, generate |
| `/gm/encounter-tables/:id` | `pages/gm/encounter-tables/[id].vue` | Encounter table editor — entries, sub-habitats, generation |
| `/gm/habitats` | `pages/gm/habitats/index.vue` | Alternate encounter table list |
| `/gm/habitats/:id` | `pages/gm/habitats/[id].vue` | Alternate encounter table editor |
| `/gm/scenes` | `pages/gm/scenes/index.vue` | Scene manager — list, activate/deactivate |
| `/gm/scenes/:id` | `pages/gm/scenes/[id].vue` | Scene editor — drag-and-drop canvas, groups, weather, habitats |
| `/gm/map` | `pages/gm/map.vue` | Region map — display and serve to Group View |

**GM layout components:** `ServerAddressDisplay.vue` (LAN address panel in GM header — shows server IP/port for player connections, click-outside dismiss, clipboard copy), `SessionUrlDisplay.vue` (combined tunnel + LAN URL panel — tunnel URL CRUD, LAN address list, clipboard copy with select-to-copy fallback for non-HTTPS, QR code toggle rendering scannable codes for each URL via `utils/qrcode.ts`).

**QR utility:** `utils/qrcode.ts` (pure TypeScript QR code encoder — byte mode, EC level L, versions 1-6, up to 134-char URLs; exports `encodeQR()`, `generateQrSvg()`, `QrSvgOptions`).

**Player connection components:** `ConnectionStatus.vue` (connection indicator dot with expandable details — connection type, state, latency, reconnect progress, retry button).

### Group View (`/group`) — TV/projector display

| Route | Component | Purpose |
|-------|-----------|---------|
| `/group` | `pages/group/index.vue` | Dynamic tab shell — lobby/scene/encounter/map |
| (tab) | `LobbyView.vue` | Waiting screen when nothing served |
| (tab) | `SceneView.vue` | Active scene with positioned sprites |
| (tab) | `EncounterView.vue` | Served encounter — health bars, turn indicator, VTT grid |
| (tab) | `MapView.vue` | Served region map |

### Player View (`/player`) — Individual player interface

| Route | Purpose |
|-------|---------|
| `/player` | Character picker, character sheet, Pokemon team, encounter with combat actions, scene view |

**Key player components:** `PlayerIdentityPicker.vue` (character selection overlay), `PlayerNavBar.vue` (bottom tab navigation — Character/Team/Encounter/Scene), `PlayerCharacterSheet.vue` (read-only stats, skills, features, equipment, inventory), `PlayerPokemonTeam.vue` + `PlayerPokemonCard.vue` + `PlayerMoveList.vue` (team display), `PlayerEncounterView.vue` (encounter state with combatant cards by side), `PlayerCombatantInfo.vue` (visibility-aware combatant display — exact HP for own, percentage for enemies), `PlayerCombatActions.vue` (full PTU combat action panel — moves, shift, struggle, pass, item/switch/maneuver requests), `PlayerSceneView.vue` (read-only scene display with characters, pokemon, groups, weather), `PlayerSkeleton.vue` (skeleton loading screen shown while character data loads).

**Key player composables:** `usePlayerIdentity.ts` (localStorage persistence, character data fetching), `usePlayerCombat.ts` (turn detection, action execution, move availability, target helpers, league battle phase awareness, canBeCommanded check, WebSocket send via provide/inject), `useCharacterExportImport.ts` (JSON export download, import file upload with conflict detection feedback), `usePlayerWebSocket.ts` (single WebSocket connection owner for player page — scene sync, character updates, action ack routing, auto-identification on connect/reconnect), `usePlayerScene.ts` (player scene state — receives scene_sync via WS, REST fallback via fetchActiveScene, maps to PlayerSceneData), `useHapticFeedback.ts` (haptic feedback for touch interactions — vibration API wrapper for mobile devices).

**Player stores:** `playerIdentity` (characterId, character, pokemon, loading, error).

**Connection utilities:** `utils/connectionType.ts` (shared `getConnectionType()` — returns 'localhost' | 'lan' | 'tunnel' based on hostname, used by useWebSocket.ts and ConnectionStatus.vue).

**Player types:** `types/player.ts` (PlayerTab), `types/api.ts` (PlayerActionRequest, WebSocketEvent), `types/player-sync.ts` (PlayerActionRequest, PlayerActionAck, PlayerTurnNotification, PlayerMoveRequest, PlayerMoveResponse, GroupViewRequest, GroupViewResponse, SceneSyncPayload).

**Player API endpoints:** `POST /api/player/action-request` (REST fallback for player action requests when WS is disconnected — registers in shared pendingRequests map, forwards to GM peers).

**Player WebSocket events:** `keepalive` / `keepalive_ack` (45s interval to prevent tunnel idle timeout), `scene_sync` (full scene data pushed to player on connect), `scene_request` (player requests current active scene), `player_action` (player submits action to GM), `player_action_ack` (GM acknowledges action — routed via pendingRequests map), `player_turn_notify` (P1 — turn notification), `player_move_request` / `player_move_response` (P1 — token movement), `group_view_request` / `group_view_response` (P1 — tab change requests).

**GM WebSocket events (League Battle):** `trainer_declared` (GM broadcasts to encounter room after a trainer records a declaration), `declaration_update` (GM broadcasts updated declarations array to encounter room for Group View sync).

## API Endpoint Groups

### Characters (`/api/characters`)
CRUD + healing/rest + equipment + XP actions.
- `GET/POST /api/characters` — list, create
- `GET/PUT/DELETE /api/characters/:id` — read, update, delete
- `GET /api/characters/:id/equipment` — current equipment slots + aggregate bonuses
- `PUT /api/characters/:id/equipment` — equip/unequip items (Zod-validated)
- `POST /api/characters/:id/xp` — award/deduct trainer XP (auto-level at 10 XP, bank clamp, level cap 50)
- `GET /api/characters/:id/xp-history` — current trainer XP state (bank, level, xpToNextLevel, capturedSpecies)
- `POST /api/characters/:id/rest` — 30-min rest
- `POST /api/characters/:id/extended-rest` — 4h+ rest
- `POST /api/characters/:id/pokemon-center` — full heal
- `POST /api/characters/:id/heal-injury` — heal injury
- `POST /api/characters/:id/new-day` — reset daily limits
- `GET /api/characters/players` — player characters only
- `POST /api/characters/import-csv` — CSV import

**Key equipment components:** `HumanEquipmentTab.vue` (equipment slot management — equip/unequip/custom items, catalog dropdown, combat bonuses summary), `EquipmentCatalogBrowser.vue` (modal catalog browser with slot filtering, search, and direct equip-to-character). Constants in `constants/equipment.ts` (catalog, slot labels, stat labels). Bonuses utility in `utils/equipmentBonuses.ts`.

**Trainer XP:** `utils/trainerExperience.ts` (pure XP logic — `applyTrainerXp` bank calculation with multi-level jump, `isNewSpecies` check, `TRAINER_XP_SUGGESTIONS` per decree-030 x5 cap, `SIGNIFICANCE_TO_TRAINER_XP` mapping from significance tiers to suggested trainer XP amounts, `TRAINER_MAX_LEVEL` 50, `TRAINER_XP_PER_LEVEL` 10), `composables/useTrainerXp.ts` (reactive wrapper — `awardXp`, `deductXp`, `clearPendingLevelUp`, processing/error state), `components/character/TrainerXpPanel.vue` (quick award buttons +1/+2/+3/+5, deduct -1, custom amount/reason input, progress bar, max level indicator; emits `xp-changed` and `level-up`), `components/encounter/TrainerXpSection.vue` (per-trainer XP input in post-encounter flow — suggested XP from significance tier, apply-to-all button, quick-set values, level-up preview per trainer), `components/scene/QuestXpDialog.vue` (award quest/milestone XP to all characters in a scene — amount input, reason field, per-character level-up preview, sequential API calls). Integration: TrainerXpPanel in `CharacterModal.vue` view mode, TrainerXpSection in `XpDistributionModal.vue` configure phase, QuestXpDialog in scene detail `gm/scenes/[id].vue`.

**Trainer level-up:** `utils/trainerAdvancement.ts` (pure advancement logic — `computeTrainerLevelUp`, `computeTrainerAdvancement`, `summarizeTrainerAdvancement`, milestone definitions, lifestyle stat point calculation), `composables/useTrainerLevelUp.ts` (reactive workflow state — stat allocation, edge/feature/class selection, milestone choices, effective skills tracking with bonus + regular Skill Edge rank-ups, maxHp preview, update payload builder, warnings), `components/levelup/LevelUpModal.vue` (wizard modal — milestones -> stats -> skills -> edges -> features -> classes -> summary steps, conditional step visibility based on advancement levels crossed), `components/levelup/LevelUpStatSection.vue` (stat point allocation with evasion preview), `components/levelup/LevelUpSkillSection.vue` (skill rank cap overview — read-only per decree-037, shows skill caps unlocked at L2/6/12), `components/levelup/LevelUpMilestoneSection.vue` (milestone radio choices at L5/10/20/30/40 — Amateur/Capable/Veteran/Elite/Champion with lifestyle stat points, bonus edges, or general feature options), `components/levelup/LevelUpEdgeSection.vue` (regular edge input + Skill Edge shortcut + bonus Skill Edges at L2/6/12 with rank restriction — cannot raise to newly unlocked rank), `components/levelup/LevelUpFeatureSection.vue` (free-text feature input at odd levels 3+, class hint display, existing features collapsible), `components/levelup/LevelUpClassSection.vue` (searchable class picker at L5/10 with branching specialization per decree-022, max 4 classes, Martial Artist non-branching per decree-026), `components/levelup/LevelUpSummary.vue` (review step — stat changes, milestone choices, edges, skill rank-ups from all Skill Edges, features, classes, warnings). Integration: level watcher in `CharacterModal.vue` and `gm/characters/[id].vue` intercepts level increase, opens LevelUpModal, applies results to editData with `isApplyingLevelUp` guard to prevent double-trigger.

**Trainer sprites:** `constants/trainerSprites.ts` (180 curated B2W2 sprites organized into 9 categories), `composables/useTrainerSprite.ts` (avatar URL resolution from sprite key to Showdown CDN URL), `components/character/TrainerSpritePicker.vue` (modal grid picker with category filter tabs and search).

**Trainer capabilities:** `HumanCharacter.capabilities` field (`string[]`, Prisma `String @default("[]")`). Stores trainer-specific capabilities like Naturewalk from Survivalist class (PTU p.149). Format: `["Naturewalk (Forest)", "Naturewalk (Mountain)"]`. Wired through serializers, combatant service, character APIs (`POST /api/characters`, `PUT /api/characters/:id`). Parsed by `combatantCapabilities.ts` (`getCombatantNaturewalks`, `naturewalkBypassesTerrain`, `findNaturewalkImmuneStatuses`) for VTT terrain movement and status immunity. UI: editable in `[id].vue` Classes tab, displayed in `HumanClassesTab.vue` and `CharacterModal.vue`.

### Pokemon (`/api/pokemon`)
CRUD + link/unlink + healing/rest + bulk.
- `GET/POST /api/pokemon` — list, create
- `GET/PUT/DELETE /api/pokemon/:id` — read, update, delete
- `POST /api/pokemon/:id/link` — link to trainer
- `POST /api/pokemon/:id/unlink` — unlink from trainer
- `POST /api/pokemon/:id/rest` — 30-min rest
- `POST /api/pokemon/:id/extended-rest` — 4h+ rest
- `POST /api/pokemon/:id/pokemon-center` — full heal
- `POST /api/pokemon/:id/heal-injury` — heal injury
- `POST /api/pokemon/:id/new-day` — reset daily limits
- `POST /api/pokemon/:id/add-experience` — manual/training XP grant with level-up detection
- `POST /api/pokemon/:id/allocate-stats` — allocate stat points with Base Relations validation (incremental or batch mode, PTU HP formula, decree-035)
- `POST /api/pokemon/:id/assign-ability` — assign ability at Level 20/40 milestone (validates level, ability count, pool membership, fetches effect from AbilityData)
- `POST /api/pokemon/:id/learn-move` — learn move from learnset (validates MoveData, no duplicates, 6-move max, add or replace by index)
- `POST /api/pokemon/:id/evolution-check` — check evolution eligibility (level/item/triggers) + P1: ability remap preview, evolution move list with MoveData enrichment, resolution options with effects + P2: `preventedByItem` (Everstone/Eviolite), `requiredGender`, `requiredMove` in response
- `POST /api/pokemon/:id/evolve` — perform evolution (species, stats, HP recalc, encounter-active guard) + P1: accepts abilities array (GM-resolved), moves array (final move list), updates capabilities and skills from target species + P2: accepts `consumeItem` (stone from trainer inventory, `skipInventoryCheck` GM override), `consumeHeldItem` (held item consumption), evolution history note in Pokemon notes, returns `undoSnapshot` for undo support; atomic transaction wrapping Pokemon update + stone consumption
- `POST /api/pokemon/:id/evolution-undo` — revert evolution using pre-evolution snapshot (restores species, stats, types, abilities, moves, capabilities, skills, heldItem, notes), restores consumed stone to trainer inventory, active encounter guard, WebSocket broadcast with `undone: true`
- `POST /api/pokemon/bulk-action` — bulk archive/delete

### Encounters (`/api/encounters`)
CRUD + extensive combat actions.
- `GET/POST /api/encounters` — list, create
- `GET/PUT /api/encounters/:id` — read, update
- `POST /api/encounters/from-scene` — create from scene
- `GET /api/encounters/served` — get served encounter
- `POST /api/encounters/:id/start` — start combat
- `POST /api/encounters/:id/end` — end combat
- `POST /api/encounters/:id/next-turn` — advance turn
- `POST /api/encounters/:id/declare` — record trainer declaration (League Battle)
- `POST /api/encounters/:id/switch` — full Pokemon switch (recall + release) as Standard Action with 8m range check, initiative insertion, action economy enforcement
- `POST /api/encounters/:id/recall` — standalone recall (1 = Shift Action, 2 = Standard Action), removes from field, clears volatile conditions, tracks recall_only SwitchAction
- `POST /api/encounters/:id/release` — standalone release (1 = Shift Action, 2 = Standard Action), auto-places adjacent to trainer, immediate-act logic (Section K), detects recall+release pair (Section N)
- `POST /api/encounters/:id/combatants` — add combatant
- `DELETE /api/encounters/:id/combatants/:combatantId` — remove combatant
- `POST /api/encounters/:id/damage` — apply damage
- `POST /api/encounters/:id/heal` — heal combatant
- `POST /api/encounters/:id/move` — execute move
- `POST /api/encounters/:id/stages` — combat stage modifiers
- `POST /api/encounters/:id/status` — add/remove status
- `POST /api/encounters/:id/serve` — serve to Group View
- `POST /api/encounters/:id/unserve` — unserve
- `POST /api/encounters/:id/position` — update grid position
- `PUT /api/encounters/:id/grid-config` — grid settings
- `POST/DELETE /api/encounters/:id/background` — grid background
- `GET/PUT /api/encounters/:id/fog` — fog of war
- `GET/PUT /api/encounters/:id/terrain` — terrain state
- `POST /api/encounters/:id/breather` — mid-combat rest
- `POST /api/encounters/:id/wild-spawn` — spawn wild Pokemon
- `PUT /api/encounters/:id/significance` — set GM significance multiplier + tier
- `POST /api/encounters/:id/xp-calculate` — preview XP calculation (read-only breakdown + participating Pokemon)
- `POST /api/encounters/:id/xp-distribute` — apply XP to Pokemon (updates experience, level, tutorPoints)
- `POST /api/encounters/:id/trainer-xp-distribute` — batch-award trainer XP to multiple trainers (sequential processing, encounter validation, auto-level at 10 XP, WebSocket broadcast on level change)
- `POST /api/encounters/:id/aoo-detect` — detect AoO opportunities triggered by actor action (shift_away, ranged_attack, stand_up, maneuver_other, retrieve_item). Returns triggered OutOfTurnAction objects stored as pending on encounter
- `POST /api/encounters/:id/aoo-resolve` — resolve a pending AoO action (accept/decline). Accept validates reactor eligibility, applies Struggle Attack damage, auto-declines remaining AoOs if trigger target faints

**Attack of Opportunity system (feature-016):** `server/services/out-of-turn.service.ts` (AoO detection, eligibility, resolution — canUseAoO, detectAoOTriggers, resolveAoOAction, expirePendingActions, autoDeclineFaintedReactor, cleanupResolvedActions, getDefaultOutOfTurnUsage), `constants/aooTriggers.ts` (AOO_TRIGGER_MAP, AOO_TRIGGERING_MANEUVERS, AOO_STRUGGLE_ATTACK_AC, AOO_STRUGGLE_ATTACK_DAMAGE_BASE), `utils/adjacency.ts` (areAdjacent, getAdjacentEnemies, wasAdjacentBeforeMove), `components/encounter/AoOPrompt.vue` (GM prompt panel — pending AoO list, accept/decline buttons, damage input, reactor HP display). Store: `encounter` getters `pendingAoOs`, `pendingOutOfTurnActions`, `hasAoOPrompts`; actions `detectAoO`, `resolveAoO`. Types: `OutOfTurnAction`, `OutOfTurnUsage`, `AoOTrigger`, `AOO_BLOCKING_CONDITIONS` in `types/combat.ts`. VTT integration: `useGridMovement.ts` `getAoOTriggersForMove()` for client-side preview with reactor eligibility filtering. WebSocket events: `aoo_triggered` (server -> all), `aoo_resolved` (server -> all). Round reset: `outOfTurnUsage` cleared per round in `resetCombatantsForNewRound`. `pendingActions` field on Encounter model (JSON, expired per round, cleaned up on round transition).

**Key encounter components:** `SignificancePanel.vue` (significance preset selector, difficulty adjustment, XP breakdown), `XpDistributionModal.vue` (post-combat XP allocation per player/Pokemon, includes trainer XP section with result display and partial failure handling), `TrainerXpSection.vue` (per-trainer XP input with significance-based suggestion, quick-set, level-up preview — embedded in XpDistributionModal), `LevelUpNotification.vue` (aggregated level-up details shown after XP distribution), `EvolutionConfirmModal.vue` (multi-step evolution wizard — 4 steps: stat redistribution, ability resolution, move learning, summary; Base Relations validation, HP preview, GM override; delegates to `EvolutionStatStep.vue`, `EvolutionAbilityStep.vue`, `EvolutionMoveStep.vue`), `BudgetIndicator.vue` (encounter difficulty bar/label based on level budget ratio), `DeclarationPanel.vue` (GM declaration form for League Battle trainer_declaration phase — action type select, description input, submit + next turn), `DeclarationSummary.vue` (declaration list display for Group View — collapsible round declarations with resolving/resolved state indicators), `SwitchPokemonModal.vue` (Pokemon switching modal — shows recalled Pokemon, loads bench from trainer roster, select replacement with sprite/level/HP display).

**Evolution utilities:** `utils/evolutionCheck.ts` (pure eligibility check — level/item/trigger validation, getEvolutionLevels, getEvolutionMoves with decree-036 stone vs level-based comparison, buildSelectedMoveList, EvolutionStats/EvolutionMoveDetail/EvolutionMoveResult types, validateBaseRelations re-export), `types/species.ts` (EvolutionTrigger interface — toSpecies, targetStage, minimumLevel, requiredItem, itemMustBeHeld, requiredGender, requiredMove). **Evolution sub-components:** `EvolutionStatStep.vue` (stat point allocation with base stat comparison), `EvolutionAbilityStep.vue` (auto-remap display, preserved abilities, GM resolution dropdown with effects), `EvolutionMoveStep.vue` (current/available moves, add/replace/remove workflow). **Evolution undo:** `composables/useEvolutionUndo.ts` (client-side snapshot storage, canUndo/undoEvolution/clearUndo, session-scoped Map keyed by Pokemon ID). **Evolution service:** `server/services/evolution.service.ts` (PokemonSnapshot with notes + consumedStone for full undo, consumeStoneFromInventory, restoreStoneToInventory, performEvolution in atomic transaction). WebSocket event: `pokemon_evolved` (server -> all clients, includes `undone: true` for undo events).

**Level-up stat allocation:** `utils/baseRelations.ts` (pure PTU Base Relations Rule utilities — buildStatTiers, validateBaseRelations, getValidAllocationTargets, extractStatPoints with warnings, formatStatName; decree-035 ordering), `composables/useLevelUpAllocation.ts` (reactive stat allocation workflow — pending allocation, validation, valid targets, budget tracking, submit to server, pendingAbilityMilestone, pendingNewMoves, hasPendingActions), `components/pokemon/StatAllocationPanel.vue` (interactive stat point allocation UI — tier display, +/- controls, validation feedback, partial allocation with confirmation).

**Level-up ability/move assignment:** `utils/abilityAssignment.ts` (pure ability pool computation — categorizeAbilities into Basic/Advanced/High, getAbilityPool for second/third milestone excluding held abilities), `components/pokemon/AbilityAssignmentPanel.vue` (radio button ability picker — category labels, effect text from batch API, submit to assign-ability endpoint), `components/pokemon/MoveLearningPanel.vue` (current moves display with 6 slots, available new moves with full details, add-to-slot or replace-existing-move workflows, batch move detail fetch).

**Switching system:** `composables/useSwitching.ts` (getBenchPokemon, canSwitch, canFaintedSwitch pre-validation, executeSwitch, executeRecall, executeRelease), `server/services/switching.service.ts` (validateSwitch 10-step chain, validateFaintedSwitch, validateForcedSwitch, checkRecallRange 8m PTU diagonal, insertIntoTurnOrder full contact + league, removeCombatantFromEncounter, markActionUsed, buildSwitchAction, canSwitchedPokemonBeCommanded, hasInitiativeAlreadyPassed Section K, findAdjacentPosition, checkRecallReleasePair Section N, applyRecallSideEffects). Store actions: `switchPokemon`, `recallPokemon`, `releasePokemon`. Switch/Fainted Switch/Force Switch buttons on `CombatantCard.vue` for trainers and owned Pokemon. WebSocket events: `pokemon_switched`, `pokemon_recalled`, `pokemon_released` (server -> all clients). `switchActions` field on Encounter model (JSON, cleared per round; tracks full_switch, fainted_switch, forced_switch, recall_only, release_only action types).

**Budget system:** `utils/encounterBudget.ts` (pure PTU level budget calculator — budget formula, difficulty assessment, XP calculation, SIGNIFICANCE_PRESETS), `composables/useEncounterBudget.ts` (reactive wrapper for active encounter budget analysis).

**Significance on Encounter model:** `significanceMultiplier` (Float, default 1.0) + `significanceTier` (String, default "insignificant"). Set at encounter creation via StartEncounterModal/GenerateEncounterModal. Editable mid-encounter via significance.put endpoint.

**VTT Grid composables:** `useRangeParser.ts` (range parsing, LoS, AoE), `usePathfinding.ts` (A* pathfinding with elevation, movement range flood-fill, movement validation), `useGridMovement.ts` (terrain-aware movement, speed modifiers), `useGridInteraction.ts` (2D grid interaction), `useGridRendering.ts` (2D grid rendering), `useCanvasRendering.ts` (canvas setup), `useCanvasDrawing.ts` (2D drawing primitives), `useTerrainPersistence.ts` (terrain save/load), `useTouchInteraction.ts` (shared touch gesture handling — single-finger pan, pinch-to-zoom, tap detection for 2D and isometric grids), `useIsometricProjection.ts` (isometric math), `useIsometricCamera.ts` (camera rotation/zoom), `useIsometricRendering.ts` (isometric grid + token rendering), `useIsometricInteraction.ts` (isometric click/hover/drag), `useIsometricOverlays.ts` (isometric fog of war, terrain, measurement diamond overlay rendering), `useDepthSorting.ts` (painter's algorithm depth ordering), `useElevation.ts` (token/terrain elevation state + flying defaults), `useFlankingDetection.ts` (reactive FlankingMap from combatant positions — PTU p.232 flanking detection, isTargetFlanked, getFlankingPenalty; used by GridCanvas.vue for VTTToken isFlanked prop and exposed getFlankingPenalty for accuracy calculation).

**VTT Grid components:** `VTTContainer.vue` (2D/isometric mode switch), `GridCanvas.vue` (2D canvas + flanking detection — exposes `getFlankingPenalty` for accuracy calculation, passes `isTargetFlanked` to VTTToken), `IsometricCanvas.vue` (isometric canvas + elevation wiring), `CameraControls.vue` (rotation buttons), `ElevationToolbar.vue` (token/terrain elevation editing toolbar), `TerrainPainter.vue` (terrain type selector, brush size, elevation brush for isometric), `VTTToken.vue` (token display — `isFlanked` prop drives CSS pulsing dashed border via `--flanked` class), `ZoomControls.vue`, `CoordinateDisplay.vue`, `GridSettingsPanel.vue`, `FogToolbar.vue`, `TerrainToolbar.vue`.

**VTT Grid utilities:** `utils/combatantCapabilities.ts` (shared combatantCanFly, getSkySpeed, combatantCanSwim, combatantCanBurrow), `utils/gridDistance.ts` (PTU diagonal distance calculation — alternating 1m/2m diagonal movement cost formula), `utils/sizeCategory.ts` (PTU size category to grid footprint — SizeCategory type, SIZE_FOOTPRINT_MAP, sizeToFootprint, getFootprintCells, isFootprintInBounds; used by useGridMovement for multi-cell occupation and bounds checks), `utils/flankingGeometry.ts` (pure PTU flanking geometry — NEIGHBOR_OFFSETS, FLANKING_FOES_REQUIRED size-to-count map, FLANKING_EVASION_PENALTY constant, getOccupiedCells, getAdjacentCells, areAdjacent, checkFlanking; no Vue dependencies, fully unit-testable).

**Type immunity utility:** `utils/typeStatusImmunity.ts` (shared between server and client — TYPE_STATUS_IMMUNITIES map, isImmuneToStatus, getImmuneType, findImmuneStatuses; per decree-012, PTU p.239 type-based status immunities).

### Encounter Templates (`/api/encounter-templates`)
Full CRUD + save-from/load-to encounter.
- `GET/POST /api/encounter-templates` — list, create
- `GET/PUT/DELETE /api/encounter-templates/:id` — read, update, delete
- `POST /api/encounter-templates/from-encounter` — save current as template
- `POST /api/encounter-templates/:id/load` — load into new encounter

### Encounter Tables (`/api/encounter-tables`)
Full CRUD + nested entries + sub-habitats + import/export + generate.
- `GET/POST /api/encounter-tables` — list, create
- `GET/PUT/DELETE /api/encounter-tables/:id` — read, update, delete
- `POST /api/encounter-tables/import` — import JSON
- `GET /api/encounter-tables/:id/export` — export JSON
- `POST /api/encounter-tables/:id/generate` — generate wild Pokemon
- `POST /api/encounter-tables/:id/entries` — add entry
- `PUT/DELETE /api/encounter-tables/:id/entries/:entryId` — update, remove
- Sub-habitats: `GET/POST /api/encounter-tables/:id/modifications`, nested entries

### Scenes (`/api/scenes`)
Full CRUD + activate/deactivate + nested entities.
- `GET/POST /api/scenes` — list, create
- `GET/PUT/DELETE /api/scenes/:id` — read, update, delete
- `GET /api/scenes/active` — active scene
- `POST /api/scenes/:id/activate` — serve to Group View
- `POST /api/scenes/:id/deactivate` — unserve
- `POST/DELETE /api/scenes/:id/characters/:charId` — add/remove character
- `POST/DELETE /api/scenes/:id/pokemon/:pokemonId` — add/remove Pokemon
- `POST /api/scenes/:id/groups` — create group
- `PUT/DELETE /api/scenes/:id/groups/:groupId` — update/delete group
- `PUT /api/scenes/:id/positions` — batch update positions

### Damage Calculation (`/api/encounters/:id/calculate-damage`)
Read-only combat math endpoint.
- `POST /api/encounters/:id/calculate-damage` — compute full PTU 9-step damage formula (STAB, type effectiveness, stages, crit) with detailed breakdown. Also computes dynamic evasion (physical, special, speed) from stage-modified stats and accuracy threshold. Does not modify encounter state.

### Capture (`/api/capture`)
Action-only.
- `POST /api/capture/rate` — calculate capture rate
- `POST /api/capture/attempt` — execute capture

### Group View State (`/api/group`)
Get/set/clear pattern.
- `GET/PUT /api/group/tab` — active tab state
- `GET/POST/DELETE /api/group/map` — served map
- `GET/POST/DELETE /api/group/wild-spawn` — wild spawn preview

### Player Data (`/api/player`)
Export/import for offline character management.
- `GET /api/player/export/:characterId` — export character + Pokemon as JSON blob (with metadata: exportVersion, exportedAt, appVersion)
- `POST /api/player/import/:characterId` — import offline edits (background, personality, goals, notes, nicknames, held items, move order) with conflict detection (server wins)

### Settings (`/api/settings`)
- `GET /api/settings/server-info` — LAN network addresses, port, primary URL for player connections
- `GET /api/settings/tunnel` — get configured Cloudflare Tunnel URL
- `PUT /api/settings/tunnel` — set or clear Cloudflare Tunnel URL (Zod-validated)

### Utilities
- `GET /api/species` — species list (search/autocomplete)
- `GET /api/species/:name` — single species lookup (abilities, numBasicAbilities, learnset, base stats, evolution info)
- `POST /api/abilities/batch` — batch ability detail lookup from AbilityData (up to 50 names)
- `POST /api/moves/batch` — batch move detail lookup from MoveData (up to 50 names)
- `POST /api/game/new-day` — global daily reset

## Store-to-Domain Mapping

| Store | Domain | Key API Groups |
|-------|--------|---------------|
| `encounter` | Active encounter | encounters (combat actions) |
| `encounterCombat` | Status/stages | encounters (status, stages) |
| `encounterXp` | XP calculation/distribution | encounters (xp-calculate, xp-distribute, trainer-xp-distribute) |
| `encounterGrid` | VTT grid | encounters (position, grid-config, background) |
| `encounterLibrary` | Templates | encounter-templates |
| `encounterTables` | Encounter tables | encounter-tables |
| `library` | Characters + Pokemon | characters, pokemon |
| `groupView` | Group TV display | group (map, wild-spawn) |
| `groupViewTabs` | Tab routing + scenes | group (tab), scenes |
| `fogOfWar` | Fog of war grid | encounters (fog) |
| `terrain` | Terrain grid | encounters (terrain) |
| `measurement` | Range measurement | (client-only) |
| `selection` | Grid selection | (client-only) |
| `settings` | User preferences | (localStorage only) |

## Server Services & Utilities

| File | Purpose |
|------|---------|
| `server/services/pokemon-generator.service.ts` | Canonical Pokemon creation — generatePokemonData, createPokemonRecord, buildPokemonCombatant |
| `server/services/evolution.service.ts` | Pokemon evolution — extractStatPoints, recalculateStats, remapAbilities (positional R032), enrichAbilityEffects (batch), performEvolution (species, types, stats, HP, spriteUrl, abilities, moves, capabilities, skills, notes; atomic transaction with stone consumption), consumeStoneFromInventory, restoreStoneToInventory; PokemonSnapshot (includes notes + consumedStone for full undo) |
| `server/services/rest-healing.service.ts` | Extended rest move refresh — refreshDailyMoves, refreshDailyMovesForOwnedPokemon |
| `server/services/csv-import.service.ts` | CSV import parsing (trainer/pokemon sheets) and DB creation |
| `server/services/entity-builder.service.ts` | Prisma record → typed entity (buildPokemonEntityFromRecord, buildHumanEntityFromRecord) |
| `server/services/combatant.service.ts` | Combatant builder, damage pipeline, calculateCurrentInitiative (CS-modified speed for initiative) |
| `server/services/encounter.service.ts` | Encounter CRUD, reorderInitiativeAfterSpeedChange (decree-006), saveInitiativeReorder |
| `server/services/status-automation.service.ts` | Tick damage calculation for status conditions (Burned, Poisoned, Badly Poisoned, Cursed). Pure functions: calculateTickDamage, calculateBadlyPoisonedDamage, getTickDamageEntries. TICK_DAMAGE_CONDITIONS constant in `constants/statusConditions.ts`. Integrated into `next-turn.post.ts` (fires before turn advance). WebSocket event: `status_tick` (server → all clients). `badlyPoisonedRound` field on Combatant model tracks escalation. |
| `server/services/switching.service.ts` | Pokemon switching logic — validateSwitch (10-step chain), validateFaintedSwitch, validateForcedSwitch, checkRecallRange (8m PTU diagonal), insertIntoTurnOrder (full contact + league), removeCombatantFromEncounter, markActionUsed, buildSwitchAction, canSwitchedPokemonBeCommanded, hasInitiativeAlreadyPassed, findAdjacentPosition, checkRecallReleasePair, applyRecallSideEffects |
| `server/services/out-of-turn.service.ts` | AoO detection/resolution — canUseAoO, detectAoOTriggers, resolveAoOAction, expirePendingActions, autoDeclineFaintedReactor, cleanupResolvedActions |
| `server/services/entity-update.service.ts` | Entity update broadcasting |
| `server/services/grid-placement.service.ts` | VTT grid placement and size-to-token mapping |
| `server/utils/csv-parser.ts` | Reusable CSV parser (parseCSV, getCell, parseNumber) |
| `server/utils/prisma.ts` | Prisma client singleton |
| `server/utils/websocket.ts` | WebSocket broadcast utilities |
| `server/utils/pendingRequests.ts` | Shared pending action request tracking (requestId -> characterId routing, 60s TTL) |
| `server/utils/pokemon-nickname.ts` | Nickname resolution |

## Selector Guidance

Prefer `data-testid` attributes for Playwright selectors. The app does not currently have widespread `data-testid` usage — add them as needed when writing spec files, or fall back to:

1. `getByRole()` — buttons, links, headings
2. `getByLabel()` — form inputs
3. `getByText()` — visible text content
4. `.locator('css-selector')` — last resort
