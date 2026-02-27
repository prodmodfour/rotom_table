---
domain: combat
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 159
files_read: 42
---

# App Capabilities: Combat

> Re-mapped: 2026-02-26. Covers Equipment P0+P1+P2 (DR, shields, evasion, Focus bonuses, HumanEquipmentTab, catalog browser), Focus stat bonuses for initiative+evasion, helmet DR fix, league battle modes, XP system, weather duration, move frequency, all combat mechanics.

---

## Prisma Model Capabilities

### combat-C001: Encounter Model
- **cap_id**: combat-C001
- **name**: Encounter Prisma Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma` — `model Encounter`
- **game_concept**: Combat encounter — the container for all combat state
- **description**: Stores encounter name, battle type (trainer/full_contact), weather (with duration and source tracking), combatants JSON, turn order (overall + trainer + pokemon phase orders), round/turn index, active/paused/served state, VTT grid config (2D + isometric), fog of war, terrain, move log, XP tracking (defeatedEnemies, xpDistributed, significanceMultiplier, significanceTier).
- **inputs**: Created via API; updated via combat actions
- **outputs**: Full encounter state object
- **accessible_from**: gm, group, player

### combat-C002: HumanCharacter Equipment Field
- **cap_id**: combat-C002
- **name**: Equipment JSON Storage
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `HumanCharacter.equipment`
- **game_concept**: PTU trainer equipment slots (head, body, mainHand, offHand, feet, accessory)
- **description**: JSON string storing EquipmentSlots object mapping slot names to EquippedItem objects. Supports DR, evasion bonus, stat bonuses (Focus items), speed default CS (Heavy Armor), conditional DR (Helmet), readied shield bonuses.
- **inputs**: Updated via PUT /api/characters/:id/equipment
- **outputs**: Equipment slots + computed aggregate bonuses
- **accessible_from**: gm, player

### combat-C003: Encounter Weather Fields
- **cap_id**: combat-C003
- **name**: Weather State Tracking
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Encounter.weather`, `weatherDuration`, `weatherSource`
- **game_concept**: PTU weather conditions (sunny, rain, sandstorm, hail, etc.) with duration tracking
- **description**: Three fields track weather: condition name (nullable), rounds remaining (0 = indefinite/manual), and source (move/ability/manual). Duration auto-decrements at round boundaries. Manual weather persists indefinitely.
- **inputs**: Set via POST /api/encounters/:id/weather
- **outputs**: Weather state on encounter object
- **accessible_from**: gm, group, player

### combat-C004: Encounter League Battle Fields
- **cap_id**: combat-C004
- **name**: League Battle Phase Tracking
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Encounter.currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`
- **game_concept**: PTU League Battle mode — trainers declare first (low-to-high speed), then Pokemon act (high-to-low speed)
- **description**: Tracks battle phase (trainer_declaration, trainer_resolution, pokemon), separate turn orders for trainers and pokemon. Phase transitions handled by next-turn endpoint.
- **inputs**: Set on encounter start; advanced by next-turn
- **outputs**: Phase and turn order arrays on encounter object
- **accessible_from**: gm, group, player

### combat-C005: Encounter XP Tracking Fields
- **cap_id**: combat-C005
- **name**: XP Distribution State
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Encounter.defeatedEnemies`, `xpDistributed`, `significanceMultiplier`, `significanceTier`
- **game_concept**: PTU XP calculation — defeated enemy levels * significance / player count
- **description**: Tracks defeated enemies (species, level, type) for XP calculation, whether XP has been distributed (safety flag), GM-set significance multiplier (1.0-5.0), and significance tier label.
- **inputs**: defeatedEnemies auto-populated on faint; significance set via API; xpDistributed set on distribute
- **outputs**: XP calculation data
- **accessible_from**: gm

---

## API Endpoint Capabilities

### combat-C010: Create Encounter
- **cap_id**: combat-C010
- **name**: Create Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/index.post.ts`
- **game_concept**: Starting a new combat encounter
- **description**: Creates a new encounter with name, battle type (trainer/full_contact), optional weather, and optional significance (multiplier + tier). Returns the created encounter object.
- **inputs**: `{ name, battleType, weather?, significanceMultiplier?, significanceTier? }`
- **outputs**: Encounter data object
- **accessible_from**: gm

### combat-C011: List Encounters
- **cap_id**: combat-C011
- **name**: List Encounters
- **type**: api-endpoint
- **location**: `app/server/api/encounters/index.get.ts`
- **game_concept**: Browsing active/past encounters
- **description**: Returns all encounters from the database.
- **inputs**: None
- **outputs**: Array of encounter data objects
- **accessible_from**: gm

### combat-C012: Get Encounter
- **cap_id**: combat-C012
- **name**: Get Encounter by ID
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id].get.ts`
- **game_concept**: Loading a specific encounter
- **description**: Retrieves a single encounter by ID with full combat state.
- **inputs**: Encounter ID (route param)
- **outputs**: Encounter data object
- **accessible_from**: gm, group, player

### combat-C013: Update Encounter
- **cap_id**: combat-C013
- **name**: Update Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id].put.ts`
- **game_concept**: Full encounter state update (used for undo/redo)
- **description**: Replaces encounter state with provided data. Primary use is undo/redo restoring snapshots.
- **inputs**: Full encounter state in body
- **outputs**: Updated encounter data
- **accessible_from**: gm

### combat-C014: Create Encounter from Scene
- **cap_id**: combat-C014
- **name**: Create Encounter from Scene
- **type**: api-endpoint
- **location**: `app/server/api/encounters/from-scene.post.ts`
- **game_concept**: Transitioning from narrative scene to combat
- **description**: Creates an encounter from a scene's characters and Pokemon, converting them to combatants with initiative calculation. Supports battle type and significance params.
- **inputs**: `{ sceneId, battleType, significanceMultiplier?, significanceTier? }`
- **outputs**: Encounter data with pre-populated combatants
- **accessible_from**: gm

### combat-C015: Start Encounter
- **cap_id**: combat-C015
- **name**: Start Encounter (Initiative Sort)
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/start.post.ts`
- **game_concept**: Initiating combat — initiative sorting, phase setup
- **description**: Activates the encounter, sorts combatants by initiative (with roll-off for ties), resets turn states, resets scene-frequency moves. For League battles: separates trainer declaration order (low-to-high speed) and pokemon action order (high-to-low speed), starts in trainer_declaration phase.
- **inputs**: Encounter ID
- **outputs**: Encounter with sorted turnOrder, active state, phase
- **accessible_from**: gm

### combat-C016: End Encounter
- **cap_id**: combat-C016
- **name**: End Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/end.post.ts`
- **game_concept**: Ending combat
- **description**: Marks encounter as inactive.
- **inputs**: Encounter ID
- **outputs**: Updated encounter data
- **accessible_from**: gm

### combat-C017: Next Turn
- **cap_id**: combat-C017
- **name**: Advance Turn
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/next-turn.post.ts`
- **game_concept**: PTU turn progression with phase and round management
- **description**: Advances to next combatant. Marks current combatant as acted, clears temp conditions. Handles League battle phase transitions (trainer_declaration -> pokemon -> new round). At round boundary: resets all combatants for new round, decrements weather duration (auto-clears when expired, skips manual weather).
- **inputs**: Encounter ID
- **outputs**: Updated encounter with new turn index, possibly new round/phase
- **accessible_from**: gm

### combat-C018: Add Combatant
- **cap_id**: combat-C018
- **name**: Add Combatant to Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/combatants.post.ts`
- **game_concept**: Adding a Pokemon or trainer to combat
- **description**: Looks up entity (Pokemon or HumanCharacter), builds full combatant wrapper with initiative, evasions, equipment bonuses (shields, Focus, Heavy Armor speed CS), and turn state.
- **inputs**: `{ entityId, entityType, side, initiativeBonus?, position? }`
- **outputs**: Updated encounter with new combatant
- **accessible_from**: gm

### combat-C019: Remove Combatant
- **cap_id**: combat-C019
- **name**: Remove Combatant from Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts`
- **game_concept**: Removing a combatant from battle
- **description**: Removes a combatant by ID, adjusts turn order if needed.
- **inputs**: Encounter ID, Combatant ID
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C020: Apply Damage
- **cap_id**: combat-C020
- **name**: Apply Damage to Combatant
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/damage.post.ts`
- **game_concept**: PTU damage application with temp HP, injuries, fainting
- **description**: Applies damage using full PTU mechanics: temp HP absorbs first, massive damage rule (50%+ maxHP = injury), HP marker crossings (50%, 0%, -50%, -100% = injury each), faint at 0 HP clears persistent+volatile conditions. Tracks defeated enemies for XP. Syncs to database.
- **inputs**: `{ combatantId, damage }`
- **outputs**: Updated encounter + damageResult breakdown
- **accessible_from**: gm

### combat-C021: Heal Combatant
- **cap_id**: combat-C021
- **name**: Heal Combatant in Combat
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/heal.post.ts`
- **game_concept**: In-combat healing (HP, temp HP, injuries)
- **description**: Heals a combatant: HP capped at injury-reduced effective max, temp HP keeps higher of old/new (no stacking), injury healing. Removes Fainted status if healed from 0 HP.
- **inputs**: `{ combatantId, amount?, tempHp?, healInjuries? }`
- **outputs**: Updated encounter + heal result
- **accessible_from**: gm

### combat-C022: Execute Move
- **cap_id**: combat-C022
- **name**: Execute Move in Combat
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/move.post.ts`
- **game_concept**: Using a Pokemon move in combat
- **description**: Validates move frequency restrictions (At-Will, EOT, Scene, Daily, Static), applies per-target damage using PTU mechanics, increments move usage tracking, creates move log entry, decrements action count. Supports per-target damage via targetDamages map.
- **inputs**: `{ actorId, moveId, targetIds, damage?, targetDamages?, notes? }`
- **outputs**: Updated encounter with move log
- **accessible_from**: gm, player

### combat-C023: Modify Combat Stages
- **cap_id**: combat-C023
- **name**: Modify Combat Stage Modifiers
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/stages.post.ts`
- **game_concept**: PTU combat stages (-6 to +6) for atk, def, spA, spD, spe, accuracy, evasion
- **description**: Updates combat stages on a combatant. Supports delta or absolute mode. Clamps to -6/+6.
- **inputs**: `{ combatantId, changes: Record<stat, value>, absolute? }`
- **outputs**: Updated encounter + stage change details
- **accessible_from**: gm

### combat-C024: Update Status Conditions
- **cap_id**: combat-C024
- **name**: Add/Remove Status Conditions
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/status.post.ts`
- **game_concept**: PTU status conditions — persistent, volatile, and other
- **description**: Adds and/or removes status conditions. Validates against known PTU conditions. Bulk add/remove in single call.
- **inputs**: `{ combatantId, add?: StatusCondition[], remove?: StatusCondition[] }`
- **outputs**: Updated encounter + status change details
- **accessible_from**: gm

### combat-C025: Take a Breather
- **cap_id**: combat-C025
- **name**: Take a Breather Maneuver
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/breather.post.ts`
- **game_concept**: PTU Take a Breather (p.245) — Full Action
- **description**: Resets combat stages (respects Heavy Armor speed CS -1), removes temp HP, cures volatile conditions + Slowed + Stuck (except Cursed), applies Tripped + Vulnerable as temp conditions. Marks standard+shift used. Logs to move log.
- **inputs**: `{ combatantId }`
- **outputs**: Updated encounter + breather result
- **accessible_from**: gm

### combat-C026: Sprint Action
- **cap_id**: combat-C026
- **name**: Sprint Combat Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/sprint.post.ts`
- **game_concept**: PTU Sprint — Standard Action for +50% movement
- **description**: Marks combatant as sprinting (temp condition), uses standard action.
- **inputs**: `{ combatantId }`
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C027: Pass Turn
- **cap_id**: combat-C027
- **name**: Pass Turn Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/pass.post.ts`
- **game_concept**: Forfeiting remaining actions
- **description**: Forfeits all remaining actions for the combatant.
- **inputs**: `{ combatantId }`
- **outputs**: Updated encounter
- **accessible_from**: gm, player

### combat-C028: Calculate Damage (Read-Only)
- **cap_id**: combat-C028
- **name**: Calculate Damage Preview
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/calculate-damage.post.ts`
- **game_concept**: PTU 9-step damage formula preview
- **description**: Full PTU damage calculation: STAB, type effectiveness, combat stages, critical hits, equipment DR (auto-computes for humans including Helmet conditional DR on crits), Focus stat bonuses. Also computes dynamic evasion and accuracy threshold. Read-only.
- **inputs**: `{ attackerId, targetId, moveName, isCritical?, damageReduction? }`
- **outputs**: DamageCalcResult + AccuracyCalcResult
- **accessible_from**: gm

### combat-C029: Set Weather
- **cap_id**: combat-C029
- **name**: Set Encounter Weather
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/weather.post.ts`
- **game_concept**: PTU weather with duration
- **description**: Sets or clears weather. Source tracking (move/ability/manual) and duration in rounds.
- **inputs**: `{ weather, source?, duration? }`
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C030: Serve Encounter
- **cap_id**: combat-C030
- **name**: Serve Encounter to Group View
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/serve.post.ts`
- **game_concept**: Displaying encounter on shared TV/projector
- **description**: Marks encounter as served, updates GroupViewState. Triggers WebSocket broadcast.
- **inputs**: Encounter ID
- **outputs**: Updated encounter with isServed=true
- **accessible_from**: gm

### combat-C031: Unserve Encounter
- **cap_id**: combat-C031
- **name**: Unserve Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/unserve.post.ts`
- **game_concept**: Removing encounter from shared display
- **description**: Marks encounter as no longer served, resets GroupViewState to lobby.
- **inputs**: Encounter ID
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C032: Get Served Encounter
- **cap_id**: combat-C032
- **name**: Get Currently Served Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/served.get.ts`
- **game_concept**: Group/player view loading the active encounter
- **description**: Returns the currently served encounter or null.
- **inputs**: None
- **outputs**: Served encounter or null
- **accessible_from**: gm, group, player

### combat-C033: Wild Pokemon Spawn
- **cap_id**: combat-C033
- **name**: Spawn Wild Pokemon in Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/wild-spawn.post.ts`
- **game_concept**: Adding wild Pokemon to combat from encounter tables
- **description**: Creates Pokemon records from species/level data, builds combatants, adds to encounter.
- **inputs**: `{ pokemon: [{ speciesName, level }], side? }`
- **outputs**: Updated encounter + added pokemon IDs
- **accessible_from**: gm

### combat-C034: Set Significance
- **cap_id**: combat-C034
- **name**: Set Encounter Significance
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/significance.put.ts`
- **game_concept**: PTU significance multiplier for XP (Core p.460)
- **description**: Persists significance multiplier (1.0-5.0) and tier label.
- **inputs**: `{ significanceMultiplier, significanceTier? }`
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C035: Calculate XP Preview
- **cap_id**: combat-C035
- **name**: XP Calculation Preview
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-calculate.post.ts`
- **game_concept**: PTU XP formula preview
- **description**: Computes XP: total enemy levels (trainers double), significance, per-player share. Returns participating Pokemon. Read-only.
- **inputs**: `{ significanceMultiplier, playerCount, isBossEncounter?, trainerEnemyIds? }`
- **outputs**: totalXpPerPlayer, breakdown, participatingPokemon[]
- **accessible_from**: gm

### combat-C036: Distribute XP
- **cap_id**: combat-C036
- **name**: XP Distribution
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-distribute.post.ts`
- **game_concept**: Awarding XP to Pokemon after combat
- **description**: Applies XP, detects level-ups, updates tutor points. Sets xpDistributed safety flag.
- **inputs**: `{ significanceMultiplier, playerCount, distribution: [{ pokemonId, xpAmount }] }`
- **outputs**: results[], totalXpDistributed
- **accessible_from**: gm

### combat-C037: Get Character Equipment
- **cap_id**: combat-C037
- **name**: Get Equipment Slots and Bonuses
- **type**: api-endpoint
- **location**: `app/server/api/characters/[id]/equipment.get.ts`
- **game_concept**: Reading a trainer's equipped items
- **description**: Returns current equipment slots and aggregate bonuses (DR, evasion, stat bonuses, speed CS, conditional DR).
- **inputs**: Character ID
- **outputs**: `{ slots, aggregateBonuses }`
- **accessible_from**: gm, player

### combat-C038: Update Character Equipment
- **cap_id**: combat-C038
- **name**: Equip/Unequip Items
- **type**: api-endpoint
- **location**: `app/server/api/characters/[id]/equipment.put.ts`
- **game_concept**: Managing trainer equipment
- **description**: Equips/unequips items. Zod-validated. Slot consistency check. Two-handed auto-clear. Returns updated slots + bonuses.
- **inputs**: `{ slots: { [slotName]: EquippedItem | null } }`
- **outputs**: `{ slots, aggregateBonuses }`
- **accessible_from**: gm

### combat-C039: Update Grid Position
- **cap_id**: combat-C039
- **name**: Update Combatant Grid Position
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/position.post.ts`
- **game_concept**: Moving tokens on VTT grid
- **description**: Updates combatant x,y position.
- **inputs**: `{ combatantId, position: { x, y } }`
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C040: Update Grid Config
- **cap_id**: combat-C040
- **name**: Update VTT Grid Configuration
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/grid-config.put.ts`
- **game_concept**: VTT grid settings
- **description**: Updates grid dimensions, cell size, isometric mode, camera, elevation.
- **inputs**: Grid config fields
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C041: Manage Grid Background
- **cap_id**: combat-C041
- **name**: Set/Remove Grid Background
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/background.post.ts`, `background.delete.ts`
- **game_concept**: VTT map background
- **description**: Upload or remove background image for VTT grid.
- **inputs**: Background data (POST) or nothing (DELETE)
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C042: Get/Set Fog of War
- **cap_id**: combat-C042
- **name**: Fog of War State
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/fog.get.ts`, `fog.put.ts`
- **game_concept**: PTU fog of war — 3-state cells
- **description**: Get or update fog of war grid state.
- **inputs**: Fog state (PUT)
- **outputs**: Fog state
- **accessible_from**: gm

### combat-C043: Get/Set Terrain
- **cap_id**: combat-C043
- **name**: Terrain State
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/terrain.get.ts`, `terrain.put.ts`
- **game_concept**: Terrain types with movement costs
- **description**: Get or update terrain grid state (normal, rough, blocking, water, tall_grass, hazard).
- **inputs**: Terrain state (PUT)
- **outputs**: Terrain state
- **accessible_from**: gm

### combat-C044: Next Scene
- **cap_id**: combat-C044
- **name**: Advance to Next Scene
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/next-scene.post.ts`
- **game_concept**: PTU scene transition
- **description**: Resets scene-frequency move usage for all Pokemon combatants.
- **inputs**: Encounter ID
- **outputs**: Updated encounter
- **accessible_from**: gm

---

## Service Function Capabilities

### combat-C050: calculateDamage (Combatant Service)
- **cap_id**: combat-C050
- **name**: PTU Damage Application Calculator
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `calculateDamage()`
- **game_concept**: Damage with temp HP, massive damage, HP markers, injuries
- **description**: Temp HP absorbs first, massive damage check (50%+ maxHP), HP marker crossings (50%, 0%, -50%, -100%), injury counting, faint detection. Unclamped HP for marker detection, clamped for storage.
- **inputs**: damage, currentHp, maxHp, temporaryHp, currentInjuries
- **outputs**: DamageResult with injury/faint details
- **accessible_from**: gm (via damage/move endpoints)

### combat-C051: applyDamageToEntity
- **cap_id**: combat-C051
- **name**: Apply Damage to Entity
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `applyDamageToEntity()`
- **game_concept**: Updating combatant state after damage
- **description**: Updates HP, temp HP, injuries. On faint: clears persistent+volatile conditions (not Other), adds Fainted.
- **inputs**: Combatant, DamageResult
- **outputs**: Mutated entity
- **accessible_from**: gm (via API)

### combat-C052: applyHealingToEntity
- **cap_id**: combat-C052
- **name**: Apply Healing to Entity
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `applyHealingToEntity()`
- **game_concept**: In-combat healing
- **description**: Heals injuries first, then HP (capped at injury-reduced max), then temp HP (keep higher). Removes Fainted if healed from 0.
- **inputs**: Combatant, HealOptions
- **outputs**: HealResult
- **accessible_from**: gm (via heal endpoint)

### combat-C053: updateStatusConditions
- **cap_id**: combat-C053
- **name**: Status Condition Manager
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `updateStatusConditions()`
- **game_concept**: PTU status add/remove
- **description**: Adds/removes conditions, avoids duplicates, validates.
- **inputs**: Combatant, add[], remove[]
- **outputs**: StatusChangeResult
- **accessible_from**: gm (via status endpoint)

### combat-C054: updateStageModifiers
- **cap_id**: combat-C054
- **name**: Stage Modifier Manager
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `updateStageModifiers()`
- **game_concept**: PTU combat stages
- **description**: Delta or absolute stage updates, clamped -6/+6.
- **inputs**: Combatant, changes, isAbsolute
- **outputs**: StageChangeResult
- **accessible_from**: gm (via stages endpoint)

### combat-C055: buildCombatantFromEntity
- **cap_id**: combat-C055
- **name**: Build Combatant from Entity
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `buildCombatantFromEntity()`
- **game_concept**: Converting DB record to combat-ready combatant
- **description**: Calculates initiative (speed + bonus, affected by Heavy Armor speed CS and Focus Speed +5), computes evasions (physical/special/speed using stage-modified stats + equipment evasion bonus + Focus stat bonuses), initializes turn state. Sets Heavy Armor default speed CS on entity.
- **inputs**: BuildCombatantOptions
- **outputs**: Combatant object
- **accessible_from**: gm (via add combatant)

### combat-C056: buildPokemonEntityFromRecord
- **cap_id**: combat-C056
- **name**: Build Pokemon Entity from DB
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `buildPokemonEntityFromRecord()`
- **game_concept**: Parsing Pokemon DB data
- **description**: Transforms Prisma Pokemon record into typed entity with all JSON fields parsed.
- **inputs**: Prisma Pokemon record
- **outputs**: Typed Pokemon entity
- **accessible_from**: gm

### combat-C057: buildHumanEntityFromRecord
- **cap_id**: combat-C057
- **name**: Build Human Entity from DB
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `buildHumanEntityFromRecord()`
- **game_concept**: Parsing trainer DB data
- **description**: Transforms Prisma HumanCharacter record into typed entity with all JSON fields parsed.
- **inputs**: Prisma HumanCharacter record
- **outputs**: Typed HumanCharacter entity
- **accessible_from**: gm

### combat-C058: countMarkersCrossed
- **cap_id**: combat-C058
- **name**: HP Marker Crossing Counter
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `countMarkersCrossed()`
- **game_concept**: PTU HP marker injuries
- **description**: Counts markers crossed between previous and new HP. Uses real maxHP. Generates markers at 50% intervals into negatives.
- **inputs**: previousHp, newHp, realMaxHp
- **outputs**: { count, markers[] }
- **accessible_from**: gm (internal)

---

## Utility Function Capabilities

### combat-C060: calculateDamage (9-Step)
- **cap_id**: combat-C060
- **name**: PTU 9-Step Damage Formula
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `calculateDamage()`
- **game_concept**: Full PTU damage calculation
- **description**: DB + STAB -> set damage + crit -> add stage-modified attack (with Focus bonus) -> subtract stage-modified defense (with Focus bonus) + DR -> type effectiveness -> min 1 (0 if immune). Detailed breakdown.
- **inputs**: DamageCalcInput
- **outputs**: DamageCalcResult
- **accessible_from**: gm (via calc-damage endpoint and MoveTargetModal)

### combat-C061: calculateEvasion
- **cap_id**: combat-C061
- **name**: Dynamic Evasion Calculator
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `calculateEvasion()`
- **game_concept**: PTU two-part evasion
- **description**: Part 1: floor((stageModified(stat) + statBonus) / 5), cap 6. Part 2: bonus from moves/effects/equipment stacks additively. Total min 0.
- **inputs**: baseStat, combatStage, evasionBonus, statBonus
- **outputs**: Evasion value
- **accessible_from**: gm, player

### combat-C062: calculateAccuracyThreshold
- **cap_id**: combat-C062
- **name**: Accuracy Threshold Calculator
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `calculateAccuracyThreshold()`
- **game_concept**: PTU accuracy check
- **description**: Threshold = moveAC + min(9, evasion) - accuracyStage. Min 1.
- **inputs**: moveAC, attackerAccuracyStage, defenderEvasion
- **outputs**: Threshold number
- **accessible_from**: gm

### combat-C063: applyStageModifier
- **cap_id**: combat-C063
- **name**: Stage Multiplier Application
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `applyStageModifier()`
- **game_concept**: PTU combat stage multipliers
- **description**: Applies stage multiplier table to stat. Clamp -6/+6, floor rounding.
- **inputs**: baseStat, stage
- **outputs**: Modified stat
- **accessible_from**: gm, player

### combat-C064: applyStageModifierWithBonus
- **cap_id**: combat-C064
- **name**: Stage Modifier + Focus Bonus
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `applyStageModifierWithBonus()`
- **game_concept**: Focus +5 after combat stages (PTU p.295)
- **description**: Stage multiplier then flat bonus. For Focus-equipped trainers.
- **inputs**: baseStat, stage, postStageBonus
- **outputs**: Modified stat + bonus
- **accessible_from**: gm

### combat-C065: computeEquipmentBonuses
- **cap_id**: combat-C065
- **name**: Equipment Bonus Aggregator
- **type**: utility
- **location**: `app/utils/equipmentBonuses.ts` — `computeEquipmentBonuses()`
- **game_concept**: Aggregate combat bonuses from equipment
- **description**: Sums DR, evasion bonus, stat bonuses (first Focus only per PTU p.295), speed default CS, conditional DR. Pure function.
- **inputs**: EquipmentSlots
- **outputs**: EquipmentCombatBonuses
- **accessible_from**: gm, player

### combat-C066: checkMoveFrequency
- **cap_id**: combat-C066
- **name**: Move Frequency Validator
- **type**: utility
- **location**: `app/utils/moveFrequency.ts` — `checkMoveFrequency()`
- **game_concept**: PTU move frequency restrictions
- **description**: At-Will OK, EOT consecutive check, Scene/Scene x2/x3 with EOT between uses, Daily with per-scene cap, Static blocked.
- **inputs**: Move, currentRound
- **outputs**: FrequencyCheckResult
- **accessible_from**: gm, player

### combat-C067: incrementMoveUsage
- **cap_id**: combat-C067
- **name**: Move Usage Tracker
- **type**: utility
- **location**: `app/utils/moveFrequency.ts` — `incrementMoveUsage()`
- **game_concept**: Tracking move uses
- **description**: Returns new move with incremented counters (immutable).
- **inputs**: Move, currentRound
- **outputs**: New Move
- **accessible_from**: gm

### combat-C068: resetSceneUsage
- **cap_id**: combat-C068
- **name**: Reset Scene Move Usage
- **type**: utility
- **location**: `app/utils/moveFrequency.ts` — `resetSceneUsage()`
- **game_concept**: New scene resets scene moves
- **description**: Resets usedThisScene and lastTurnUsed. Immutable.
- **inputs**: Move[]
- **outputs**: New Move[]
- **accessible_from**: gm

### combat-C069: resetDailyUsage
- **cap_id**: combat-C069
- **name**: Reset Daily Move Usage
- **type**: utility
- **location**: `app/utils/moveFrequency.ts` — `resetDailyUsage()`
- **game_concept**: New day resets daily moves
- **description**: Resets usedToday and lastUsedAt. Immutable.
- **inputs**: Move[]
- **outputs**: New Move[]
- **accessible_from**: gm

### combat-C070: calculateEncounterBudget
- **cap_id**: combat-C070
- **name**: Level Budget Calculator
- **type**: utility
- **location**: `app/utils/encounterBudget.ts` — `calculateEncounterBudget()`
- **game_concept**: PTU encounter budget (Core p.473)
- **description**: avgLevel * 2 * playerCount.
- **inputs**: BudgetCalcInput
- **outputs**: BudgetCalcResult
- **accessible_from**: gm

### combat-C071: analyzeEncounterBudget
- **cap_id**: combat-C071
- **name**: Budget Analysis
- **type**: utility
- **location**: `app/utils/encounterBudget.ts` — `analyzeEncounterBudget()`
- **game_concept**: Encounter difficulty assessment
- **description**: Budget, effective enemy levels (trainers double), ratio, difficulty label.
- **inputs**: BudgetCalcInput, enemies[]
- **outputs**: BudgetAnalysis
- **accessible_from**: gm

### combat-C072: calculateEncounterXp
- **cap_id**: combat-C072
- **name**: XP Calculator
- **type**: utility
- **location**: `app/utils/encounterBudget.ts` — `calculateEncounterXp()`
- **game_concept**: PTU XP formula (Core p.460)
- **description**: effectiveLevels * significance / playerCount.
- **inputs**: enemies[], significanceMultiplier, playerCount
- **outputs**: { totalXp, xpPerPlayer, baseXp }
- **accessible_from**: gm

---

## Constant Capabilities

### combat-C080: COMBAT_MANEUVERS
- **cap_id**: combat-C080
- **name**: Combat Maneuver Definitions
- **type**: constant
- **location**: `app/constants/combatManeuvers.ts`
- **game_concept**: 9 PTU maneuvers — Push, Sprint, Trip, Grapple, Disarm, Dirty Trick, Intercept (2), Take a Breather
- **description**: Array of maneuver defs with id, name, action type, AC, icon, description, requiresTarget.
- **inputs**: Static
- **outputs**: Maneuver array
- **accessible_from**: gm, player

### combat-C081: EQUIPMENT_CATALOG
- **cap_id**: combat-C081
- **name**: PTU Equipment Catalog
- **type**: constant
- **location**: `app/constants/equipment.ts`
- **game_concept**: 14 standard equipment items (PTU p.286-295)
- **description**: Light/Heavy Armor, Helmet, Goggles, Gas Mask, Light/Heavy Shield, Running Shoes, Snow Boots, 5 Focus items. Each with slot, bonuses, description, cost.
- **inputs**: Static
- **outputs**: Equipment catalog
- **accessible_from**: gm

### combat-C082: STATUS_CONDITIONS
- **cap_id**: combat-C082
- **name**: Status Condition Categories
- **type**: constant
- **location**: `app/constants/statusConditions.ts`
- **game_concept**: PTU persistent, volatile, other conditions
- **description**: PERSISTENT (5), VOLATILE (9), OTHER (6). Plus CSS class mapper.
- **inputs**: Static
- **outputs**: Condition arrays + getConditionClass()
- **accessible_from**: gm, group, player

### combat-C083: SIGNIFICANCE_PRESETS
- **cap_id**: combat-C083
- **name**: Significance Tier Presets
- **type**: constant
- **location**: `app/utils/encounterBudget.ts`
- **game_concept**: 5 significance tiers for XP
- **description**: Insignificant (x1-1.5), Everyday (x2-3), Significant (x3-4), Climactic (x4-5), Legendary (x5).
- **inputs**: Static
- **outputs**: Preset array
- **accessible_from**: gm

### combat-C084: DAMAGE_BASE_CHART
- **cap_id**: combat-C084
- **name**: Damage Base Chart
- **type**: constant
- **location**: `app/utils/damageCalculation.ts`
- **game_concept**: DB to set/min/max damage
- **description**: DB 1-28 mapped to { min, avg, max }.
- **inputs**: Static
- **outputs**: Damage lookup
- **accessible_from**: gm

### combat-C085: STAGE_MULTIPLIERS
- **cap_id**: combat-C085
- **name**: Stage Multiplier Table
- **type**: constant
- **location**: `app/utils/damageCalculation.ts`
- **game_concept**: Combat stage multipliers
- **description**: -6 to +6 mapped to 0.4-2.2.
- **inputs**: Static
- **outputs**: Multiplier lookup
- **accessible_from**: gm, player

---

## Composable Capabilities

### combat-C090: useCombat
- **cap_id**: combat-C090
- **name**: Core Combat Composable
- **type**: composable-function
- **location**: `app/composables/useCombat.ts`
- **game_concept**: PTU combat math
- **description**: Stage multipliers, HP calc (Pokemon + Trainer), evasion (3 types), health status, injury check, XP gain, canAct, accuracy threshold, max AP, movement modifier.
- **inputs**: Auto-imported
- **outputs**: Combat calculation functions
- **accessible_from**: gm, group, player

### combat-C091: useMoveCalculation
- **cap_id**: combat-C091
- **name**: Move Calculation Composable
- **type**: composable-function
- **location**: `app/composables/useMoveCalculation.ts`
- **game_concept**: Full move UI logic
- **description**: STAB, accuracy with dynamic evasion (auto-selects best), d20 roll with nat 1/20, damage with DB chart, per-target damage with equipment DR (including Helmet crit DR) and Focus bonuses, type effectiveness, range/LoS filtering, target selection.
- **inputs**: Reactive refs (move, actor, targets)
- **outputs**: Full combat state + actions
- **accessible_from**: gm

### combat-C092: usePlayerCombat
- **cap_id**: combat-C092
- **name**: Player Combat Composable
- **type**: composable-function
- **location**: `app/composables/usePlayerCombat.ts`
- **game_concept**: Player combat actions
- **description**: Turn detection, League phase awareness, turn state, move availability with frequency, direct actions (move, shift, struggle, pass), WS requests (item, switch, maneuver), target helpers, canBeCommanded check.
- **inputs**: Stores + WS inject
- **outputs**: Player combat state + actions
- **accessible_from**: player

### combat-C093: useEncounterBudget
- **cap_id**: combat-C093
- **name**: Encounter Budget Composable
- **type**: composable-function
- **location**: `app/composables/useEncounterBudget.ts`
- **game_concept**: Reactive budget analysis
- **description**: Reactive wrapper for budget pure functions.
- **inputs**: Encounter data
- **outputs**: BudgetAnalysis
- **accessible_from**: gm

---

## Store Capabilities

### combat-C100: encounter store — loadEncounter
- **cap_id**: combat-C100
- **name**: Load Encounter
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `loadEncounter()`
- **game_concept**: Loading encounter state
- **description**: Fetches encounter by ID, sets as active.
- **inputs**: Encounter ID
- **outputs**: Sets store.encounter
- **accessible_from**: gm, group, player

### combat-C101: encounter store — createEncounter
- **cap_id**: combat-C101
- **name**: Create Encounter
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `createEncounter()`
- **game_concept**: Creating encounter
- **description**: Creates via API with name, battleType, weather, significance.
- **inputs**: name, battleType, weather?, significance?
- **outputs**: Created encounter
- **accessible_from**: gm

### combat-C102: encounter store — createFromScene
- **cap_id**: combat-C102
- **name**: Create From Scene
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `createFromScene()`
- **game_concept**: Scene-to-encounter
- **description**: Creates from scene with combatants and significance.
- **inputs**: sceneId, battleType, significance?
- **outputs**: Created encounter
- **accessible_from**: gm

### combat-C103-C108: encounter store — combat actions
- **cap_id**: combat-C103
- **name**: Combat Action Store Methods
- **type**: store-action
- **location**: `app/stores/encounter.ts`
- **game_concept**: Combat lifecycle and actions
- **description**: addCombatant, removeCombatant, executeMove, applyDamage, healCombatant, startEncounter, nextTurn, endEncounter, endAndClear, loadFromTemplate, useAction, setReadyAction.
- **inputs**: Various per action
- **outputs**: Updated encounter
- **accessible_from**: gm (most), player (executeMove, passTurn)

### combat-C109: encounter store — undo/redo
- **cap_id**: combat-C109
- **name**: Undo/Redo System
- **type**: store-action
- **location**: `app/stores/encounter.ts`
- **game_concept**: Combat undo/redo (50 snapshots)
- **description**: captureSnapshot, undoAction, redoAction, getUndoRedoState, initializeHistory.
- **inputs**: actionName
- **outputs**: Boolean, state
- **accessible_from**: gm

### combat-C110: encounter store — serve/unserve
- **cap_id**: combat-C110
- **name**: Serve/Unserve Actions
- **type**: store-action
- **location**: `app/stores/encounter.ts`
- **game_concept**: Display encounter on Group View
- **description**: serveEncounter, unserveEncounter, loadServedEncounter.
- **inputs**: None
- **outputs**: Updated encounter
- **accessible_from**: gm (serve/unserve), group+player (loadServed)

### combat-C111: encounter store — setWeather
- **cap_id**: combat-C111
- **name**: Set Weather
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `setWeather()`
- **game_concept**: Encounter weather
- **description**: Sets weather with source and duration.
- **inputs**: weather, source, duration
- **outputs**: Updated encounter
- **accessible_from**: gm

### combat-C112: encounter store — addWildPokemon
- **cap_id**: combat-C112
- **name**: Add Wild Pokemon
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `addWildPokemon()`
- **game_concept**: Wild spawn
- **description**: Creates and adds wild Pokemon as combatants.
- **inputs**: pokemon[], side
- **outputs**: Updated encounter + IDs
- **accessible_from**: gm

### combat-C113-C114: encounter store — significance + XP
- **cap_id**: combat-C113
- **name**: Significance and XP Actions
- **type**: store-action
- **location**: `app/stores/encounter.ts`
- **game_concept**: XP management
- **description**: setSignificance, calculateXp, distributeXp.
- **inputs**: Multiplier, counts, distribution
- **outputs**: XP data
- **accessible_from**: gm

### combat-C115: encounter store — getters
- **cap_id**: combat-C115
- **name**: Encounter Getters
- **type**: store-getter
- **location**: `app/stores/encounter.ts`
- **game_concept**: Derived combat state
- **description**: isActive, isPaused, isServed, currentRound, sceneNumber, battleType, isLeagueBattle, currentPhase, combatantsByInitiative, trainersByTurnOrder, pokemonByTurnOrder, currentCombatant, player/ally/enemy combatants, injuredCombatants, combatantsWithActions, moveLog.
- **inputs**: Store state
- **outputs**: Derived values
- **accessible_from**: gm, group, player

### combat-C116: encounter store — updateFromWebSocket
- **cap_id**: combat-C116
- **name**: WebSocket State Sync
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `updateFromWebSocket()`
- **game_concept**: Real-time sync
- **description**: Surgical update preserving Vue reactivity.
- **inputs**: WS encounter data
- **outputs**: Updated state
- **accessible_from**: gm, group, player

### combat-C117: encounterCombat store
- **cap_id**: combat-C117
- **name**: Combat Actions Store
- **type**: store-action
- **location**: `app/stores/encounterCombat.ts`
- **game_concept**: Status, stages, injuries, maneuvers, phases, scenes
- **description**: addStatusCondition, removeStatusCondition, updateStatusConditions, modifyStage, setCombatStages, addInjury, removeInjury, takeABreather, sprint, pass, setPhase, nextScene.
- **inputs**: encounterId, combatantId, params
- **outputs**: Updated encounter
- **accessible_from**: gm

---

## Component Capabilities

### combat-C120: CombatantCard
- **cap_id**: combat-C120
- **name**: GM Combatant Card
- **type**: component
- **location**: `app/components/encounter/CombatantCard.vue`
- **game_concept**: Per-combatant display with controls
- **description**: Name, sprite, HP bar, status, stages, turn indicator, inline damage/heal, move execution, stage editing, equipment bonuses display for humans.
- **inputs**: Combatant, encounter context
- **outputs**: Combat actions
- **accessible_from**: gm

### combat-C121: GroupCombatantCard
- **cap_id**: combat-C121
- **name**: Group View Combatant Card
- **type**: component
- **location**: `app/components/encounter/GroupCombatantCard.vue`
- **game_concept**: Read-only combat display for projector
- **description**: HP bar, sprite, name, status conditions. No editing.
- **inputs**: Combatant
- **outputs**: Display only
- **accessible_from**: group

### combat-C122: PlayerCombatantCard
- **cap_id**: combat-C122
- **name**: Player Combatant Card
- **type**: component
- **location**: `app/components/encounter/PlayerCombatantCard.vue`
- **game_concept**: Visibility-aware display
- **description**: Exact HP for own, percentage for enemies. Status visible.
- **inputs**: Combatant, identity
- **outputs**: Display only
- **accessible_from**: player

### combat-C123: MoveTargetModal
- **cap_id**: combat-C123
- **name**: Move Target Selection Modal
- **type**: component
- **location**: `app/components/encounter/MoveTargetModal.vue`
- **game_concept**: Full move execution UI
- **description**: Move details, target selection with range/LoS, accuracy roll, per-target damage with STAB/effectiveness/stages/equipment DR/Focus/Helmet crit DR, critical detection.
- **inputs**: Move, actor, combatants
- **outputs**: Move execution data
- **accessible_from**: gm

### combat-C124: GMActionModal
- **cap_id**: combat-C124
- **name**: GM Action Modal
- **type**: component
- **location**: `app/components/encounter/GMActionModal.vue`
- **game_concept**: GM combat action panel
- **description**: Available actions for current turn: moves, maneuvers, shift/sprint/pass.
- **inputs**: Combatant, context
- **outputs**: Action selections
- **accessible_from**: gm

### combat-C125: ManeuverGrid
- **cap_id**: combat-C125
- **name**: Maneuver Grid
- **type**: component
- **location**: `app/components/encounter/ManeuverGrid.vue`
- **game_concept**: PTU maneuver selection
- **description**: Grid of 9 maneuvers with icons and descriptions.
- **inputs**: COMBAT_MANEUVERS
- **outputs**: Selected maneuver
- **accessible_from**: gm, player

### combat-C126-C129: Combat Modals
- **cap_id**: combat-C126
- **name**: Combat Editor Modals
- **type**: component
- **location**: `app/components/encounter/CombatStagesModal.vue`, `StatusConditionsModal.vue`, `DamageSection.vue`, `TempHpModal.vue`
- **game_concept**: Stage editing, status toggling, damage entry, temp HP
- **description**: CombatStagesModal (7 stats, -6/+6), StatusConditionsModal (PTU categories), DamageSection (inline damage input), TempHpModal (temp HP entry).
- **inputs**: Current combatant state
- **outputs**: State changes
- **accessible_from**: gm

### combat-C130: AddCombatantModal
- **cap_id**: combat-C130
- **name**: Add Combatant Modal
- **type**: component
- **location**: `app/components/encounter/AddCombatantModal.vue`
- **game_concept**: Adding entities to encounter
- **description**: Select Pokemon/character, side, initiative bonus.
- **inputs**: Available entities
- **outputs**: Entity + side + bonus
- **accessible_from**: gm

### combat-C131-C135: Significance + XP Components
- **cap_id**: combat-C131
- **name**: Significance and XP Components
- **type**: component
- **location**: `app/components/encounter/SignificancePanel.vue`, `BudgetIndicator.vue`, `XpDistributionModal.vue`, `XpDistributionResults.vue`, `LevelUpNotification.vue`
- **game_concept**: Encounter difficulty + XP distribution
- **description**: SignificancePanel (5 presets, slider, XP preview), BudgetIndicator (difficulty bar), XpDistributionModal (per-player allocation), XpDistributionResults (results display), LevelUpNotification (level-up details).
- **inputs**: Encounter data, XP data
- **outputs**: Significance changes, XP confirmation
- **accessible_from**: gm

### combat-C136: HumanEquipmentTab
- **cap_id**: combat-C136
- **name**: Equipment Management Tab
- **type**: component
- **location**: `app/components/character/tabs/HumanEquipmentTab.vue`
- **game_concept**: Trainer equipment slot management
- **description**: 6 slots, catalog dropdown, unequip, custom items, combat bonuses summary.
- **inputs**: Character equipment
- **outputs**: Equipment changes
- **accessible_from**: gm

### combat-C137: EquipmentCatalogBrowser
- **cap_id**: combat-C137
- **name**: Equipment Catalog Browser
- **type**: component
- **location**: `app/components/character/EquipmentCatalogBrowser.vue`
- **game_concept**: Browsing PTU equipment
- **description**: Modal with slot filtering, search, item details, direct equip.
- **inputs**: EQUIPMENT_CATALOG, character ID
- **outputs**: Equip action
- **accessible_from**: gm

### combat-C138: BreatherShiftBanner
- **cap_id**: combat-C138
- **name**: Breather Shift Reminder
- **type**: component
- **location**: `app/components/encounter/BreatherShiftBanner.vue`
- **game_concept**: Take a Breather shift requirement
- **description**: Banner reminding shift-away-from-enemies requirement.
- **inputs**: Temp conditions
- **outputs**: Display only
- **accessible_from**: gm

### combat-C139-C144: Combat Display Components
- **cap_id**: combat-C139
- **name**: Combat Display Components
- **type**: component
- **location**: `app/components/encounter/CombatantConditionsSection.vue`, `MoveButton.vue`, `MoveInfoCard.vue`, `TargetSelector.vue`, `TargetDamageList.vue`, `CaptureRateDisplay.vue`
- **game_concept**: Combat UI elements
- **description**: CombatantConditionsSection (status badges), MoveButton (move with frequency), MoveInfoCard (move details), TargetSelector (range/LoS targets), TargetDamageList (per-target damage), CaptureRateDisplay (capture rate in encounter).
- **inputs**: Respective data
- **outputs**: Display + selections
- **accessible_from**: gm (most), player (MoveButton, MoveInfoCard)

### combat-C145-C147: Player Combat Components
- **cap_id**: combat-C145
- **name**: Player Combat Components
- **type**: component
- **location**: `app/components/player/PlayerCombatActions.vue`, `PlayerEncounterView.vue`, `PlayerCombatantInfo.vue`
- **game_concept**: Player combat UI
- **description**: PlayerCombatActions (moves, shift, struggle, pass, requests), PlayerEncounterView (encounter display with combatants by side), PlayerCombatantInfo (visibility-aware HP).
- **inputs**: Player combat state
- **outputs**: Actions + display
- **accessible_from**: player

---

## WebSocket Event Capabilities

### combat-C150: encounter_update
- **cap_id**: combat-C150
- **name**: Encounter Update Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Real-time encounter sync
- **description**: GM broadcasts encounter state to all viewers.
- **inputs**: Encounter data
- **outputs**: Broadcast to group+player
- **accessible_from**: gm (send), group+player (receive)

### combat-C151: turn_change
- **cap_id**: combat-C151
- **name**: Turn Change Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Turn advancement
- **description**: Broadcast on turn change.
- **inputs**: Turn data
- **outputs**: Broadcast
- **accessible_from**: gm+group+player

### combat-C152: damage_applied / heal_applied
- **cap_id**: combat-C152
- **name**: Damage/Heal Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Damage/heal notifications
- **description**: Broadcast on damage/heal.
- **inputs**: Damage/heal data
- **outputs**: Broadcast
- **accessible_from**: gm+group+player

### combat-C153: status_change / move_executed
- **cap_id**: combat-C153
- **name**: Status/Move Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Combat action notifications
- **description**: Broadcast status changes and move executions.
- **inputs**: Event data
- **outputs**: Broadcast
- **accessible_from**: gm+group+player

### combat-C154: combatant_added / combatant_removed
- **cap_id**: combat-C154
- **name**: Combatant Roster Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Roster changes
- **description**: Broadcast on add/remove combatant.
- **inputs**: Combatant data
- **outputs**: Broadcast
- **accessible_from**: gm+group+player

### combat-C155: serve_encounter / encounter_unserved
- **cap_id**: combat-C155
- **name**: Serve/Unserve Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Display management
- **description**: Broadcast serve/unserve to group+player.
- **inputs**: Encounter ID
- **outputs**: Broadcast
- **accessible_from**: gm (send), group+player (receive)

### combat-C156: player_action / player_action_ack
- **cap_id**: combat-C156
- **name**: Player Action Request/Ack
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Player requesting GM approval
- **description**: Player sends request (item/switch/maneuver), GM responds with ack. PendingRequests routing.
- **inputs**: PlayerActionRequest / ack
- **outputs**: Forward/route
- **accessible_from**: player (request), gm (ack)

### combat-C157: player_turn_notify
- **cap_id**: combat-C157
- **name**: Player Turn Notification
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Turn notification
- **description**: GM notifies player their turn started.
- **inputs**: playerId
- **outputs**: Routed to player
- **accessible_from**: gm (send), player (receive)

### combat-C158: movement_preview
- **cap_id**: combat-C158
- **name**: Movement Preview
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: VTT token preview
- **description**: GM previews token move, broadcast to group.
- **inputs**: Movement data
- **outputs**: Broadcast
- **accessible_from**: gm (send), group+player (receive)

### combat-C159: player_move_request / player_move_response
- **cap_id**: combat-C159
- **name**: Player Token Move
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Player VTT movement
- **description**: Player requests token move, GM approves/denies.
- **inputs**: Move request
- **outputs**: Forward/route
- **accessible_from**: player (request), gm (respond)

---

## Capability Chains

### Chain 1: Move Execution (GM)
GMActionModal -> MoveTargetModal -> useMoveCalculation -> encounter store.executeMove -> POST /api/encounters/:id/move -> combatant.service (calculateDamage, applyDamageToEntity) -> entity-update.service -> Prisma
- **Accessibility**: gm

### Chain 2: Move Execution (Player)
PlayerCombatActions -> usePlayerCombat.executeMove -> encounter store.executeMove -> POST /api/encounters/:id/move -> combatant.service -> Prisma
- **Accessibility**: player

### Chain 3: Damage Application
CombatantCard.DamageSection -> encounter store.applyDamage -> POST /api/encounters/:id/damage -> combatant.service -> entity-update.service -> Prisma
- **Accessibility**: gm

### Chain 4: Damage Calculation Preview
POST /api/encounters/:id/calculate-damage -> damageCalculation.calculateDamage + computeEquipmentBonuses + calculateEvasion + calculateAccuracyThreshold
- **Accessibility**: gm

### Chain 5: Equipment Management
HumanEquipmentTab / EquipmentCatalogBrowser -> PUT /api/characters/:id/equipment -> Zod validation -> computeEquipmentBonuses -> Prisma
- **Accessibility**: gm

### Chain 6: Equipment Combat Integration
buildCombatantFromEntity -> computeEquipmentBonuses -> evasion (shields), initiative (Heavy Armor + Focus Speed), stat bonuses
- **Accessibility**: gm (via add combatant)

### Chain 7: Take a Breather
ManeuverGrid -> encounterCombat.takeABreather -> POST /api/encounters/:id/breather -> stage reset (Heavy Armor aware), temp HP removal, volatile cure, Tripped+Vulnerable
- **Accessibility**: gm

### Chain 8: Turn Progression
encounter store.nextTurn -> POST /api/encounters/:id/next-turn -> mark acted, clear temps, phase transition (League), round boundary (reset, weather decrement)
- **Accessibility**: gm

### Chain 9: XP Distribution
SignificancePanel -> XpDistributionModal -> encounter store.calculateXp -> POST /xp-calculate -> preview -> store.distributeXp -> POST /xp-distribute -> LevelUpNotification / XpDistributionResults
- **Accessibility**: gm

### Chain 10: Real-time Sync
GM action -> API -> WS broadcast (encounter_update, damage_applied, etc.) -> encounter store.updateFromWebSocket (group/player)
- **Accessibility**: gm (initiate), group+player (receive)

### Chain 11: Player Action Requests
PlayerCombatActions -> usePlayerCombat.request* -> WS player_action -> GM -> WS player_action_ack -> player
- **Accessibility**: player (initiate), gm (approve)

### Chain 12: Weather
encounter store.setWeather -> POST /api/encounters/:id/weather -> next-turn auto-decrement at round boundary
- **Accessibility**: gm

### Chain 13: Budget Analysis
useEncounterBudget -> encounterBudget.analyzeEncounterBudget -> BudgetIndicator
- **Accessibility**: gm

---

## Accessibility Summary

| Category | Cap IDs |
|----------|---------|
| **gm-only** | C010, C011, C013, C014, C015, C016, C017, C018, C019, C020, C021, C023, C024, C025, C026, C028, C029, C030, C031, C033, C034, C035, C036, C038, C039-C044, C050-C058, C060, C062, C064, C067-C072, C081, C083-C084, C091, C093, C101, C102, C109, C117, C120, C123, C124, C126-C138 |
| **gm + group + player** | C001, C003, C004, C012, C032, C063, C082, C085, C090, C100, C115, C116, C139, C150-C155 |
| **gm + player** | C002, C005, C022, C027, C037, C061, C065, C066, C080, C092, C103-C108, C110, C125, C140-C141, C145-C147, C156-C159 |
| **player-only** | C092 (full player combat actions), C122, C145-C147 |
| **group-only** | C121 (GroupCombatantCard) |

---

## Missing Subsystems

### 1. No Player-Facing Equipment View
- **subsystem**: Players cannot view their trainer's equipment or combat bonuses from the player view
- **actor**: player
- **ptu_basis**: PTU equipment (p.286-295) affects combat directly — players need DR, evasion, Focus stats
- **impact**: Players must ask the GM what equipment they have. Equipment bonuses affect combat decisions.

### 2. No Player Damage Calculation Preview
- **subsystem**: Players cannot preview move damage calculations before committing
- **actor**: player
- **ptu_basis**: PTU p.237-240 — players choose moves based on expected damage
- **impact**: Only GM can use calculate-damage. Players choose moves without knowing numeric outcomes.

### 3. No Held Item Combat Effect Automation
- **subsystem**: Pokemon held items have no automated combat effects
- **actor**: both
- **ptu_basis**: PTU Chapter 9 — held items modify combat behavior (Choice Band, Life Orb, Leftovers, etc.)
- **impact**: All held item effects must be manually tracked by GM.

### 4. No Ability Combat Effect Automation
- **subsystem**: Pokemon abilities have no automated combat effects
- **actor**: both
- **ptu_basis**: PTU Chapter 3 — abilities like Intimidate, Adaptability, Sand Stream trigger in combat
- **impact**: All ability effects manually applied by GM.

### 5. No Weather Combat Effect Automation
- **subsystem**: Weather tracked but combat effects not automated
- **actor**: both
- **ptu_basis**: PTU p.262-265 — weather modifies damage, inflicts end-of-turn damage, modifies accuracy
- **impact**: Weather displayed but mechanical effects (type bonuses, EOT damage, accuracy) manually applied.

### 6. No Type Chart Reference for Players
- **subsystem**: No in-app type effectiveness reference
- **actor**: player
- **ptu_basis**: PTU type chart — players need matchup knowledge
- **impact**: Players reference external type charts.

### 7. No Status Condition Effect Description for Players
- **subsystem**: No detailed status condition mechanical descriptions in player view
- **actor**: player
- **ptu_basis**: PTU p.246-249 — conditions have complex effects players need to reference
- **impact**: Players see condition badges without knowing mechanical effects.
