---
domain: pokemon-lifecycle
mapped_at: 2026-02-26T14:30:00Z
mapped_by: app-capability-mapper
total_capabilities: 85
files_read: 35
---

# App Capabilities: Pokemon Lifecycle

## Summary
- Total capabilities: 85
- Types: api-endpoint(17), service-function(5), composable-function(11), store-action(7), store-getter(5), component(7), utility(16), constant(4), websocket-event(1), prisma-model(2), prisma-field(10)
- Orphan capabilities: 0

---

## Prisma Models

### pokemon-lifecycle-C001: Pokemon Prisma Model
- **cap_id**: pokemon-lifecycle-C001
- **name**: Pokemon Data Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma:Pokemon`
- **game_concept**: Core Pokemon entity
- **description**: Primary data model for all Pokemon. Stores species, level, experience, nature (JSON), base/current stats, types, abilities (JSON), moves (JSON), capabilities (JSON), skills (JSON), status conditions, injuries, HP, held item, gender, shiny flag, origin, location, owner relationship, archive flag (isInLibrary), tutor points, training exp, egg groups, and rest/healing tracking fields.
- **inputs**: N/A (schema definition)
- **outputs**: Defines the complete Pokemon record shape
- **accessible_from**: gm, player, group, api-only

### pokemon-lifecycle-C002: SpeciesData Prisma Model
- **cap_id**: pokemon-lifecycle-C002
- **name**: Species Reference Data Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma:SpeciesData`
- **game_concept**: Pokemon species reference data (seeded from PTU pokedex)
- **description**: Reference data for each Pokemon species seeded from the PTU pokedex. Contains base stats, types, abilities (JSON), learnset (JSON with level+move entries), evolution stage/max, movement capabilities, size, weight class, power, jump, skills, egg groups, and numeric basic ability count. Used by pokemon-generator service and level-up check.
- **inputs**: Populated by seed.ts from books/markdown/pokedexes/
- **outputs**: Species lookup data for generation, level-up, capture rate
- **accessible_from**: api-only

---

## Prisma Fields (Key Pokemon Fields)

### pokemon-lifecycle-C003: origin Field
- **cap_id**: pokemon-lifecycle-C003
- **name**: Pokemon Origin Tracking
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.origin`
- **game_concept**: How a Pokemon was created
- **description**: String field tracking provenance: 'manual' (GM-created), 'wild' (encounter table spawn), 'template' (loaded from template), 'import' (CSV import), 'captured' (capture system). Default 'manual'.
- **inputs**: Set at creation or on capture
- **outputs**: Used for library filtering
- **accessible_from**: gm, player

### pokemon-lifecycle-C004: isInLibrary Field (Archive Flag)
- **cap_id**: pokemon-lifecycle-C004
- **name**: Pokemon Archive Flag
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.isInLibrary`
- **game_concept**: Archive/visibility control
- **description**: Boolean flag repurposed as an archive indicator. true = visible in sheets and library, false = archived (hidden from sheets but preserved in DB). Default true.
- **inputs**: Set via bulk-action archive or direct PUT
- **outputs**: Filters library queries (GET /api/pokemon excludes archived unless includeArchived=true)
- **accessible_from**: gm

### pokemon-lifecycle-C005: ownerId Field
- **cap_id**: pokemon-lifecycle-C005
- **name**: Pokemon Owner Relationship
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.ownerId`
- **game_concept**: Trainer-Pokemon ownership link
- **description**: Foreign key to HumanCharacter. Nullable. Set via link/unlink endpoints or capture auto-link. Determines which trainer's party a Pokemon belongs to.
- **inputs**: String (HumanCharacter ID) or null
- **outputs**: Used for library grouping, party display, XP distribution grouping
- **accessible_from**: gm, player

### pokemon-lifecycle-C006: experience Field
- **cap_id**: pokemon-lifecycle-C006
- **name**: Pokemon Experience Points
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.experience`
- **game_concept**: PTU cumulative XP (Core p.203)
- **description**: Integer tracking total accumulated experience. Updated by add-experience endpoint and XP distribution. Capped at MAX_EXPERIENCE (20,555 for level 100). Level derived from experience via EXPERIENCE_CHART lookup.
- **inputs**: Integer, incremented by XP grants
- **outputs**: Determines level progression
- **accessible_from**: gm, player

### pokemon-lifecycle-C007: level Field
- **cap_id**: pokemon-lifecycle-C007
- **name**: Pokemon Level
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.level`
- **game_concept**: PTU Pokemon level (1-100)
- **description**: Integer level. Updated alongside experience when XP causes level-ups. Used in HP formula (level + HP_stat*3 + 10), stat point distribution, move learning, ability milestones, and capture rate calculation.
- **inputs**: Integer 1-100
- **outputs**: HP calculation, move learning eligibility, ability milestones
- **accessible_from**: gm, player

### pokemon-lifecycle-C008: tutorPoints Field
- **cap_id**: pokemon-lifecycle-C008
- **name**: Pokemon Tutor Points
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.tutorPoints`
- **game_concept**: PTU tutor point currency (Core p.202)
- **description**: Integer tracking tutor points. Gained at level 5 and every 5 levels thereafter. Updated by add-experience and xp-distribute endpoints when leveling. Used for purchasing TM moves and tutored moves.
- **inputs**: Integer, incremented on qualifying level-ups
- **outputs**: Displayed on skills tab
- **accessible_from**: gm, player

### pokemon-lifecycle-C009: maxHp Field
- **cap_id**: pokemon-lifecycle-C009
- **name**: Pokemon Max HP
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.maxHp`
- **game_concept**: PTU HP formula: Level + (HP_stat * 3) + 10
- **description**: Integer maximum HP. Recalculated on level-up (level component increases by 1 per level gained). HP stat component only changes when stat points are manually allocated. If Pokemon was at full HP before leveling, currentHp is also increased to prevent appearing damaged.
- **inputs**: Calculated from level + baseHp
- **outputs**: Rest healing cap, combat HP bar
- **accessible_from**: gm, player, group

### pokemon-lifecycle-C010: nature Field
- **cap_id**: pokemon-lifecycle-C010
- **name**: Pokemon Nature
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.nature`
- **game_concept**: PTU Nature system (Core Chapter 5, p.199)
- **description**: JSON string storing { name, raisedStat, loweredStat }. 36 possible natures (30 with stat effects, 6 neutral). Affects base stats: HP +1/-1, other stats +2/-2. Applied at generation time via applyNatureToBaseStats(). Neutral natures (raise === lower) have no effect.
- **inputs**: Generated randomly at Pokemon creation
- **outputs**: Base stat modification, displayed on stats tab
- **accessible_from**: gm, player

### pokemon-lifecycle-C011: moves Field
- **cap_id**: pokemon-lifecycle-C011
- **name**: Pokemon Move Set
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.moves`
- **game_concept**: PTU move list (up to 6 active)
- **description**: JSON array of MoveDetail objects (name, type, damageClass, frequency, ac, damageBase, range, effect). Auto-selected from learnset at generation (most recent 6 at or below level). Can be overridden via template loading. Updated by player import (reorder only). Level-up detection reports new available moves but does not auto-add.
- **inputs**: Array of MoveDetail objects
- **outputs**: Move cards on moves tab, damage/attack rolls
- **accessible_from**: gm, player

### pokemon-lifecycle-C012: abilities Field
- **cap_id**: pokemon-lifecycle-C012
- **name**: Pokemon Abilities
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.abilities`
- **game_concept**: PTU ability slots (Basic at creation, Advanced at 20, any at 40)
- **description**: JSON array of { name, effect } objects. One Basic Ability randomly selected at generation. Additional ability slots unlock at level 20 (second: Basic or Advanced) and level 40 (third: any category). Level-up check reports milestones but does not auto-assign.
- **inputs**: Array of ability objects
- **outputs**: Ability cards on abilities tab
- **accessible_from**: gm, player

---

## Constants

### pokemon-lifecycle-C013: NATURE_TABLE
- **cap_id**: pokemon-lifecycle-C013
- **name**: PTU Nature Chart
- **type**: constant
- **location**: `app/constants/natures.ts` -- `NATURE_TABLE`
- **game_concept**: PTU 36 natures with stat modifiers (Core Chapter 5, p.199)
- **description**: Complete mapping of 36 nature names to { raise, lower } stat keys. 30 natures have distinct raise/lower stats; 6 neutral natures (Composed, Hardy, Docile, Bashful, Quirky, Serious) have raise === lower.
- **inputs**: N/A (constant)
- **outputs**: Used by applyNatureToBaseStats() and pokemon-generator
- **accessible_from**: api-only

### pokemon-lifecycle-C014: EXPERIENCE_CHART
- **cap_id**: pokemon-lifecycle-C014
- **name**: PTU Experience Chart
- **type**: constant
- **location**: `app/utils/experienceCalculation.ts` -- `EXPERIENCE_CHART`
- **game_concept**: Cumulative XP thresholds for levels 1-100 (Core p.203)
- **description**: Record<number, number> mapping level to cumulative XP needed. Level 1 = 0 XP, Level 100 = 20,555 XP. Used by getLevelForXp(), getXpForLevel(), getXpToNextLevel().
- **inputs**: N/A (constant)
- **outputs**: Level determination from XP
- **accessible_from**: gm (via utility functions)

### pokemon-lifecycle-C015: SIGNIFICANCE_PRESETS
- **cap_id**: pokemon-lifecycle-C015
- **name**: XP Significance Multiplier Presets
- **type**: constant
- **location**: `app/utils/experienceCalculation.ts` -- `SIGNIFICANCE_PRESETS`
- **game_concept**: GM-assigned encounter significance for XP (Core p.460)
- **description**: Derived from encounterBudget.ts canonical source. Maps tier names to multipliers: insignificant (1.0), everyday (2.0), significant (3.5), climactic (4.5), legendary (5.0). Used in XpDistributionModal preset selector.
- **inputs**: N/A (constant)
- **outputs**: XP calculation multiplier
- **accessible_from**: gm

### pokemon-lifecycle-C016: SIGNIFICANCE_PRESET_LABELS
- **cap_id**: pokemon-lifecycle-C016
- **name**: XP Significance Display Labels
- **type**: constant
- **location**: `app/utils/experienceCalculation.ts` -- `SIGNIFICANCE_PRESET_LABELS`
- **game_concept**: Human-readable significance tier names
- **description**: Record mapping preset keys to friendly labels for UI display. Used in XpDistributionModal and SignificancePanel for consistent labeling.
- **inputs**: N/A (constant)
- **outputs**: UI labels
- **accessible_from**: gm

---

## Utility Functions

### pokemon-lifecycle-C017: applyNatureToBaseStats
- **cap_id**: pokemon-lifecycle-C017
- **name**: Nature Stat Modifier Application
- **type**: utility
- **location**: `app/constants/natures.ts` -- `applyNatureToBaseStats()`
- **game_concept**: PTU nature stat adjustments (HP: +1/-1, others: +2/-2)
- **description**: Pure function. Returns a new stats object with nature modifiers applied. HP uses +1/-1, non-HP stats use +2/-2. Stats floored at 1. Neutral natures return unmodified copy. Does not mutate input.
- **inputs**: baseStats object, natureName string
- **outputs**: Modified stats object (immutable)
- **accessible_from**: api-only (used by pokemon-generator)

### pokemon-lifecycle-C018: checkLevelUp
- **cap_id**: pokemon-lifecycle-C018
- **name**: Per-Level Level-Up Info Calculator
- **type**: utility
- **location**: `app/utils/levelUpCheck.ts` -- `checkLevelUp()`
- **game_concept**: PTU level-up effects (Core Chapter 5, pp.201-202)
- **description**: Pure function. Returns array of LevelUpInfo (one per level gained): +1 stat point per level, new moves from learnset at exactly that level, ability milestones (level 20: second ability, level 40: third ability), tutor points at level 5 and every 5 levels. Does NOT handle evolution (conditions vary by species).
- **inputs**: { oldLevel, newLevel, learnset: LearnsetEntry[] }
- **outputs**: LevelUpInfo[] with newMoves, abilityMilestone, tutorPointGained per level
- **accessible_from**: api-only

### pokemon-lifecycle-C019: summarizeLevelUps
- **cap_id**: pokemon-lifecycle-C019
- **name**: Level-Up Summary Aggregator
- **type**: utility
- **location**: `app/utils/levelUpCheck.ts` -- `summarizeLevelUps()`
- **game_concept**: Aggregate multi-level level-up info for display
- **description**: Pure function. Combines array of LevelUpInfo into a single summary: totalStatPoints, allNewMoves, abilityMilestones, totalTutorPoints. Used by level-up-check endpoint for single notification display.
- **inputs**: LevelUpInfo[]
- **outputs**: { totalStatPoints, allNewMoves, abilityMilestones, totalTutorPoints }
- **accessible_from**: api-only

### pokemon-lifecycle-C020: calculateEncounterXp
- **cap_id**: pokemon-lifecycle-C020
- **name**: Post-Combat XP Calculator
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `calculateEncounterXp()`
- **game_concept**: PTU post-combat XP formula (Core p.460)
- **description**: Pure function. Step 1: sum defeated enemy levels (trainers count as 2x). Step 2: multiply by GM significance multiplier (0.5-10). Step 3: divide by player count (unless boss encounter). All divisions floored. Returns full breakdown with per-enemy contributions.
- **inputs**: XpCalculationInput (defeatedEnemies, significanceMultiplier, playerCount, isBossEncounter)
- **outputs**: XpCalculationResult (totalXpPerPlayer, breakdown with enemy details)
- **accessible_from**: gm (via xp-calculate/xp-distribute endpoints)

### pokemon-lifecycle-C021: calculateLevelUps
- **cap_id**: pokemon-lifecycle-C021
- **name**: XP Application Level-Up Calculator
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `calculateLevelUps()`
- **game_concept**: Determine level-ups from XP gain (Core p.202-203)
- **description**: Pure function. Given current experience/level and XP to add, determines new level via EXPERIENCE_CHART lookup, then delegates to checkLevelUp() for per-level details. Returns XpApplicationResult with previousExperience, newExperience, levelsGained, and LevelUpEvent array.
- **inputs**: currentExperience, currentLevel, xpToAdd, learnset?, evolutionLevels?
- **outputs**: Omit<XpApplicationResult, 'pokemonId' | 'species'>
- **accessible_from**: api-only

### pokemon-lifecycle-C022: enrichDefeatedEnemies
- **cap_id**: pokemon-lifecycle-C022
- **name**: Defeated Enemy Enrichment
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `enrichDefeatedEnemies()`
- **game_concept**: Trainer identification for XP 2x multiplier
- **description**: Pure function. Converts raw defeated enemy entries (from encounter JSON) into DefeatedEnemy shape. Determines isTrainer via the type field on the entry (new entries) or fallback trainerEnemyIds (legacy). Default false.
- **inputs**: RawDefeatedEnemy[], optional trainerEnemyIds string[]
- **outputs**: DefeatedEnemy[] with isTrainer flag
- **accessible_from**: api-only

### pokemon-lifecycle-C023: getXpForLevel
- **cap_id**: pokemon-lifecycle-C023
- **name**: XP Threshold Lookup
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `getXpForLevel()`
- **game_concept**: PTU Experience Chart lookup (Core p.203)
- **description**: Pure function. Returns cumulative XP needed to reach a specific level (1-100). Returns 0 for invalid levels below 1, MAX_EXPERIENCE for levels above 100.
- **inputs**: level number
- **outputs**: XP threshold number
- **accessible_from**: gm (via modal preview)

### pokemon-lifecycle-C024: getLevelForXp
- **cap_id**: pokemon-lifecycle-C024
- **name**: Level from XP Lookup
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `getLevelForXp()`
- **game_concept**: Reverse XP chart lookup
- **description**: Pure function. Walks chart from level 100 down to find highest level the XP qualifies for. Returns 1-100.
- **inputs**: totalXp number
- **outputs**: level number
- **accessible_from**: gm (via modal level-up preview)

### pokemon-lifecycle-C025: getXpToNextLevel
- **cap_id**: pokemon-lifecycle-C025
- **name**: XP to Next Level Calculator
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `getXpToNextLevel()`
- **game_concept**: Remaining XP until next level
- **description**: Pure function. Returns XP remaining until the next level. 0 if at max level. Max(0, nextLevelXp - currentExperience).
- **inputs**: currentExperience, currentLevel
- **outputs**: XP remaining number
- **accessible_from**: gm

### pokemon-lifecycle-C026: resolvePresetFromMultiplier
- **cap_id**: pokemon-lifecycle-C026
- **name**: Significance Preset Resolver
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `resolvePresetFromMultiplier()`
- **game_concept**: Map multiplier value back to preset name
- **description**: Pure function. Given a numeric multiplier, finds the matching SIGNIFICANCE_PRESETS key. Returns 'custom' if no preset matches. Used to initialize XpDistributionModal from encounter's persisted significanceMultiplier.
- **inputs**: multiplier number
- **outputs**: SignificancePreset | 'custom'
- **accessible_from**: gm

### pokemon-lifecycle-C027: resolveNickname
- **cap_id**: pokemon-lifecycle-C027
- **name**: Auto-Nickname Generator
- **type**: utility
- **location**: `app/server/utils/pokemon-nickname.ts` -- `resolveNickname()`
- **game_concept**: Default Pokemon naming convention
- **description**: Async function. If nickname provided and non-empty, returns trimmed nickname. Otherwise, counts existing Pokemon of same species in DB and generates "Species N+1" (e.g., "Pikachu 3"). Used by both index.post.ts and pokemon-generator service.
- **inputs**: species string, optional nickname string
- **outputs**: Resolved nickname string
- **accessible_from**: api-only

### pokemon-lifecycle-C028: serializePokemon
- **cap_id**: pokemon-lifecycle-C028
- **name**: Pokemon Response Serializer
- **type**: utility
- **location**: `app/server/utils/serializers.ts` -- `serializePokemon()`
- **game_concept**: JSON response normalization
- **description**: Converts a raw Prisma Pokemon record into a client-friendly shape: parses JSON fields (nature, stageModifiers, abilities, moves, capabilities, skills, eggGroups, statusConditions), restructures stats into baseStats/currentStats objects with semantic keys. Used by all Pokemon GET/PUT/POST endpoints.
- **inputs**: Prisma Pokemon record
- **outputs**: Serialized Pokemon object with parsed JSON fields
- **accessible_from**: api-only

---

## Service Functions

### pokemon-lifecycle-C029: generatePokemonData
- **cap_id**: pokemon-lifecycle-C029
- **name**: Pokemon Data Generator (Pure)
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `generatePokemonData()`
- **game_concept**: Full Pokemon sheet generation from species + level
- **description**: Async function. Looks up SpeciesData, selects random nature and applies modifiers, distributes stat points (level + 10 points weighted by base stats with Base Relations enforcement), calculates HP (level + HP_stat*3 + 10), selects up to 6 moves from learnset, picks random Basic Ability, assigns random gender. Supports overrideMoves and overrideAbilities for template preservation. No DB writes.
- **inputs**: GeneratePokemonInput (speciesName, level, nickname?, origin, overrideMoves?, overrideAbilities?)
- **outputs**: GeneratedPokemonData (full sheet data)
- **accessible_from**: api-only

### pokemon-lifecycle-C030: createPokemonRecord
- **cap_id**: pokemon-lifecycle-C030
- **name**: Pokemon DB Record Creator
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `createPokemonRecord()`
- **game_concept**: Persist generated Pokemon to database
- **description**: Async function. Takes GeneratePokemonInput + GeneratedPokemonData and creates a Prisma Pokemon record. Always sets isInLibrary: true. Resolves nickname via resolveNickname(). Stores origin and originLabel (in notes). Returns CreatedPokemon with id, species, level, nickname, data.
- **inputs**: GeneratePokemonInput, GeneratedPokemonData
- **outputs**: CreatedPokemon
- **accessible_from**: api-only

### pokemon-lifecycle-C031: generateAndCreatePokemon
- **cap_id**: pokemon-lifecycle-C031
- **name**: Pokemon Generate + Create (Combined)
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `generateAndCreatePokemon()`
- **game_concept**: Primary entry point for Pokemon creation
- **description**: Async function. Calls generatePokemonData() then createPokemonRecord(). Primary entry point for wild spawns, template loads, and scene-to-encounter conversion.
- **inputs**: GeneratePokemonInput
- **outputs**: CreatedPokemon
- **accessible_from**: api-only

### pokemon-lifecycle-C032: buildPokemonCombatant
- **cap_id**: pokemon-lifecycle-C032
- **name**: Pokemon-to-Combatant Builder
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `buildPokemonCombatant()`
- **game_concept**: Embed Pokemon in encounter combatants JSON
- **description**: Converts a CreatedPokemon into a full Combatant wrapper via createdPokemonToEntity() and buildCombatantFromEntity(). Determines token size from species size. Used when spawning Pokemon directly into encounters.
- **inputs**: CreatedPokemon, side string, optional position {x, y}
- **outputs**: Combatant object for encounter JSON
- **accessible_from**: api-only

### pokemon-lifecycle-C033: distributeStatPoints (internal)
- **cap_id**: pokemon-lifecycle-C033
- **name**: Stat Point Distribution with Base Relations
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `distributeStatPoints()`
- **game_concept**: PTU stat point allocation (Core Chapter 5, Base Relations Rule)
- **description**: Internal function. Distributes (level + 10) stat points weighted by base stats using random rolls, then enforces Base Relations Rule: stats with higher base values must have >= added points than stats with lower base values. Equal base stats form tiers with randomized internal order.
- **inputs**: baseStats object, level number
- **outputs**: Calculated stats object (base + distributed)
- **accessible_from**: api-only (internal to service)

---

## API Endpoints

### pokemon-lifecycle-C034: GET /api/pokemon
- **cap_id**: pokemon-lifecycle-C034
- **name**: List All Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/index.get.ts`
- **game_concept**: Pokemon library listing
- **description**: Returns all Pokemon, sorted by species asc. Filters: origin (string, optional), includeArchived (boolean, default false). When includeArchived is false, only returns Pokemon with isInLibrary=true. Uses serializePokemon() for consistent response shape.
- **inputs**: Query params: origin?, includeArchived?
- **outputs**: { success: true, data: Pokemon[] }
- **accessible_from**: gm, player

### pokemon-lifecycle-C035: GET /api/pokemon/:id
- **cap_id**: pokemon-lifecycle-C035
- **name**: Get Single Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].get.ts`
- **game_concept**: Pokemon sheet detail view
- **description**: Returns a single Pokemon by ID with all fields serialized. 404 if not found.
- **inputs**: Route param: id
- **outputs**: { success: true, data: Pokemon }
- **accessible_from**: gm, player

### pokemon-lifecycle-C036: POST /api/pokemon
- **cap_id**: pokemon-lifecycle-C036
- **name**: Create Pokemon (Manual)
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/index.post.ts`
- **game_concept**: Manual Pokemon creation by GM
- **description**: Creates a Pokemon record from arbitrary body data. Applies PTU HP formula (level + baseHp*3 + 10). Resolves nickname via resolveNickname(). Accepts baseStats, currentStats, types, nature, abilities, moves, capabilities, skills, eggGroups, and all other fields. Default origin: 'manual'. Does NOT use pokemon-generator service (that's for wild/template).
- **inputs**: Body: full or partial Pokemon data
- **outputs**: { success: true, data: Pokemon }
- **accessible_from**: gm

### pokemon-lifecycle-C037: PUT /api/pokemon/:id
- **cap_id**: pokemon-lifecycle-C037
- **name**: Update Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].put.ts`
- **game_concept**: Edit Pokemon stats, moves, items, etc.
- **description**: Updates any subset of Pokemon fields. Handles JSON serialization for nature, stageModifiers, abilities, moves, statusConditions. Supports baseStats and currentStats as nested objects. Also handles healing fields (injuries, restMinutesToday, etc.). Resolves nickname changes via resolveNickname().
- **inputs**: Route param: id, Body: partial Pokemon data
- **outputs**: { success: true, data: Pokemon }
- **accessible_from**: gm

### pokemon-lifecycle-C038: DELETE /api/pokemon/:id
- **cap_id**: pokemon-lifecycle-C038
- **name**: Delete Single Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].delete.ts`
- **game_concept**: Permanent Pokemon removal
- **description**: Permanently deletes a Pokemon record by ID. No active encounter guard (that's only on bulk-action).
- **inputs**: Route param: id
- **outputs**: { success: true }
- **accessible_from**: gm

### pokemon-lifecycle-C039: POST /api/pokemon/:id/link
- **cap_id**: pokemon-lifecycle-C039
- **name**: Link Pokemon to Trainer
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/link.post.ts`
- **game_concept**: Trainer-Pokemon ownership assignment
- **description**: Sets ownerId on a Pokemon record to the specified trainerId. Verifies both Pokemon and trainer exist. Returns full parsed Pokemon data.
- **inputs**: Route param: id, Body: { trainerId }
- **outputs**: { data: Pokemon }
- **accessible_from**: gm

### pokemon-lifecycle-C040: POST /api/pokemon/:id/unlink
- **cap_id**: pokemon-lifecycle-C040
- **name**: Unlink Pokemon from Trainer
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/unlink.post.ts`
- **game_concept**: Release Pokemon from trainer ownership
- **description**: Sets ownerId to null on a Pokemon record. Returns full parsed Pokemon data.
- **inputs**: Route param: id
- **outputs**: { data: Pokemon }
- **accessible_from**: gm

### pokemon-lifecycle-C041: POST /api/pokemon/bulk-action
- **cap_id**: pokemon-lifecycle-C041
- **name**: Bulk Archive/Delete Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/bulk-action.post.ts`
- **game_concept**: Mass Pokemon management
- **description**: Bulk archive (isInLibrary=false) or delete Pokemon. Accepts pokemonIds array OR filter (origin, hasOwner). Safety check: blocks both archive and delete for Pokemon in active encounters (checks encounter combatants JSON). Returns count of affected records.
- **inputs**: Body: { action: 'archive'|'delete', pokemonIds?: string[], filter?: { origin?, hasOwner? } }
- **outputs**: { success: true, data: { action, count } }
- **accessible_from**: gm

### pokemon-lifecycle-C042: POST /api/pokemon/:id/add-experience
- **cap_id**: pokemon-lifecycle-C042
- **name**: Manual XP Grant
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/add-experience.post.ts`
- **game_concept**: Standalone XP grant (training, manual GM award) (Core p.202)
- **description**: Adds XP to a single Pokemon. Validates amount is positive integer <= MAX_EXPERIENCE. Loads learnset from SpeciesData for move detection. Calls calculateLevelUps(). Updates experience, level, tutorPoints, and maxHp (level component increase). Preserves full-HP state on level-up. Separate from combat XP distribution.
- **inputs**: Route param: id, Body: { amount: number }
- **outputs**: { success: true, data: XpApplicationResult }
- **accessible_from**: gm

### pokemon-lifecycle-C043: POST /api/pokemon/:id/level-up-check
- **cap_id**: pokemon-lifecycle-C043
- **name**: Level-Up Preview
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/level-up-check.post.ts`
- **game_concept**: Preview level-up effects before committing
- **description**: Read-only endpoint. Returns level-up information for transitioning from current level to targetLevel. Uses checkLevelUp() + summarizeLevelUps(). Reports stat points, new moves, ability milestones, tutor points, and whether species was found in DB.
- **inputs**: Route param: id, Body: { targetLevel: number }
- **outputs**: { success: true, data: LevelUpSummary }
- **accessible_from**: gm

### pokemon-lifecycle-C044: POST /api/encounters/:id/xp-calculate
- **cap_id**: pokemon-lifecycle-C044
- **name**: Encounter XP Preview
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-calculate.post.ts`
- **game_concept**: Post-combat XP preview (Core p.460)
- **description**: Read-only endpoint. Loads encounter's defeated enemies, enriches trainer status, calls calculateEncounterXp(). Collects player-side Pokemon combatants with owner info. Returns XP breakdown and participating Pokemon list for the XP distribution modal. Does not write to DB.
- **inputs**: Route param: id, Body: { significanceMultiplier, playerCount, isBossEncounter?, trainerEnemyIds? }
- **outputs**: { success: true, data: { totalXpPerPlayer, breakdown, participatingPokemon[] } }
- **accessible_from**: gm

### pokemon-lifecycle-C045: POST /api/encounters/:id/xp-distribute
- **cap_id**: pokemon-lifecycle-C045
- **name**: Encounter XP Distribution (Write)
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-distribute.post.ts`
- **game_concept**: Apply post-combat XP to Pokemon (Core p.460)
- **description**: Write endpoint. Recalculates XP from encounter data to verify. Rejects duplicate pokemonIds. Validates total distribution <= maxDistributable (totalXpPerPlayer * playerCount). For each Pokemon: loads learnset, calls calculateLevelUps(), updates experience/level/tutorPoints/maxHp. Marks encounter.xpDistributed = true. Returns per-Pokemon XpApplicationResult with level-up events.
- **inputs**: Route param: id, Body: { significanceMultiplier, playerCount, isBossEncounter?, distribution: [{ pokemonId, xpAmount }] }
- **outputs**: { success: true, data: { results: XpApplicationResult[], totalXpDistributed } }
- **accessible_from**: gm

### pokemon-lifecycle-C046: GET /api/species
- **cap_id**: pokemon-lifecycle-C046
- **name**: Species Reference Data List
- **type**: api-endpoint
- **location**: `app/server/api/species/index.get.ts`
- **game_concept**: Species lookup for UI autocomplete and generation
- **description**: Returns species reference data with search and limit. Select fields: name, types, base stats, abilities, evolution stage. Parses abilities JSON. Default limit 100, max 500.
- **inputs**: Query params: search?, limit?
- **outputs**: { success: true, data: SpeciesSummary[] }
- **accessible_from**: gm

### pokemon-lifecycle-C047: GET /api/player/export/:characterId
- **cap_id**: pokemon-lifecycle-C047
- **name**: Character + Pokemon Export
- **type**: api-endpoint
- **location**: `app/server/api/player/export/[characterId].get.ts`
- **game_concept**: Offline data portability for players
- **description**: Exports full character data with all owned Pokemon as a versioned JSON blob. Includes exportVersion, exportedAt timestamp, and appVersion for import validation. Uses serializeCharacter() and serializePokemon().
- **inputs**: Route param: characterId
- **outputs**: { success: true, data: { exportVersion, exportedAt, appVersion, character, pokemon[] } }
- **accessible_from**: player

### pokemon-lifecycle-C048: POST /api/player/import/:characterId
- **cap_id**: pokemon-lifecycle-C048
- **name**: Character + Pokemon Import
- **type**: api-endpoint
- **location**: `app/server/api/player/import/[characterId].post.ts`
- **game_concept**: Merge offline player edits back to server
- **description**: Validates payload with Zod schema. Only accepts safe offline edits: character (background, personality, goals, notes), Pokemon (nickname, heldItem, move reorder). Conflict detection: if server updatedAt > exportedAt, differing fields flagged as conflicts (server wins). Atomic transaction. Returns update counts and conflict list.
- **inputs**: Route param: characterId, Body: validated import payload
- **outputs**: { success: true, data: { characterFieldsUpdated, pokemonUpdated, hasConflicts, conflicts[] } }
- **accessible_from**: player

---

## Store Actions

### pokemon-lifecycle-C049: library.loadLibrary
- **cap_id**: pokemon-lifecycle-C049
- **name**: Load Library (Characters + Pokemon)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `loadLibrary()`
- **game_concept**: Fetch all entities for library view
- **description**: Parallel-fetches GET /api/characters and GET /api/pokemon. Populates humans and pokemon state arrays. Manages loading/error state.
- **inputs**: None
- **outputs**: Populates store state
- **accessible_from**: gm

### pokemon-lifecycle-C050: library.createPokemon
- **cap_id**: pokemon-lifecycle-C050
- **name**: Create Pokemon (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `createPokemon()`
- **game_concept**: Client-side Pokemon creation
- **description**: POSTs to /api/pokemon with partial Pokemon data. Pushes returned Pokemon to store's pokemon array. Returns the created Pokemon.
- **inputs**: Partial<Pokemon> data
- **outputs**: Created Pokemon object
- **accessible_from**: gm

### pokemon-lifecycle-C051: library.updatePokemon
- **cap_id**: pokemon-lifecycle-C051
- **name**: Update Pokemon (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `updatePokemon()`
- **game_concept**: Client-side Pokemon update
- **description**: PUTs to /api/pokemon/:id with partial Pokemon data. Updates the matching entry in store's pokemon array by index. Returns updated Pokemon.
- **inputs**: id string, Partial<Pokemon> data
- **outputs**: Updated Pokemon object
- **accessible_from**: gm

### pokemon-lifecycle-C052: library.deletePokemon
- **cap_id**: pokemon-lifecycle-C052
- **name**: Delete Pokemon (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `deletePokemon()`
- **game_concept**: Client-side Pokemon deletion
- **description**: DELETEs /api/pokemon/:id. Filters Pokemon out of store's pokemon array.
- **inputs**: id string
- **outputs**: void (updates store state)
- **accessible_from**: gm

### pokemon-lifecycle-C053: library.linkPokemonToTrainer
- **cap_id**: pokemon-lifecycle-C053
- **name**: Link Pokemon to Trainer (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `linkPokemonToTrainer()`
- **game_concept**: Assign Pokemon to trainer party
- **description**: POSTs to /api/pokemon/:id/link with { trainerId }. Updates matching Pokemon in store array with returned data.
- **inputs**: pokemonId string, trainerId string
- **outputs**: void (updates store state)
- **accessible_from**: gm

### pokemon-lifecycle-C054: library.unlinkPokemon
- **cap_id**: pokemon-lifecycle-C054
- **name**: Unlink Pokemon from Trainer (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `unlinkPokemon()`
- **game_concept**: Release Pokemon from trainer
- **description**: POSTs to /api/pokemon/:id/unlink. Updates matching Pokemon in store array with returned data (ownerId now null).
- **inputs**: pokemonId string
- **outputs**: void (updates store state)
- **accessible_from**: gm

### pokemon-lifecycle-C055: encounter.calculateXp
- **cap_id**: pokemon-lifecycle-C055
- **name**: Calculate XP (Store Action)
- **type**: store-action
- **location**: `app/stores/encounter.ts` -- `calculateXp()`
- **game_concept**: Preview post-combat XP distribution
- **description**: POSTs to /api/encounters/:id/xp-calculate with significance, playerCount, and boss flag. Returns totalXpPerPlayer, breakdown, and participatingPokemon array. Used by XpDistributionModal.
- **inputs**: { significanceMultiplier, playerCount, isBossEncounter?, trainerEnemyIds? }
- **outputs**: XP calculation result with participating Pokemon
- **accessible_from**: gm

### pokemon-lifecycle-C056: encounter.distributeXp
- **cap_id**: pokemon-lifecycle-C056
- **name**: Distribute XP (Store Action)
- **type**: store-action
- **location**: `app/stores/encounter.ts` -- `distributeXp()`
- **game_concept**: Apply post-combat XP to Pokemon
- **description**: POSTs to /api/encounters/:id/xp-distribute with significance, playerCount, boss flag, and distribution array. Returns XpApplicationResult[] and totalXpDistributed. Used by XpDistributionModal Apply button.
- **inputs**: { significanceMultiplier, playerCount, isBossEncounter?, distribution: [{ pokemonId, xpAmount }] }
- **outputs**: { results: XpApplicationResult[], totalXpDistributed }
- **accessible_from**: gm

---

## Store Getters

### pokemon-lifecycle-C057: library.filteredPokemon
- **cap_id**: pokemon-lifecycle-C057
- **name**: Filtered Pokemon List
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `filteredPokemon`
- **game_concept**: Pokemon library filtering and sorting
- **description**: Filters store's pokemon array by search (species, nickname, location), pokemonType, and pokemonOrigin. Sorts by name or level (asc/desc). Returns filtered and sorted Pokemon[].
- **inputs**: LibraryFilters state (search, pokemonType, pokemonOrigin, sortBy, sortOrder)
- **outputs**: Pokemon[]
- **accessible_from**: gm

### pokemon-lifecycle-C058: library.getPokemonById
- **cap_id**: pokemon-lifecycle-C058
- **name**: Get Pokemon by ID
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `getPokemonById`
- **game_concept**: Single Pokemon lookup from store
- **description**: Returns the first Pokemon in store matching the given ID, or undefined.
- **inputs**: id string
- **outputs**: Pokemon | undefined
- **accessible_from**: gm

### pokemon-lifecycle-C059: library.getPokemonByOwner
- **cap_id**: pokemon-lifecycle-C059
- **name**: Get Pokemon by Owner
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `getPokemonByOwner`
- **game_concept**: Trainer's party lookup
- **description**: Returns all Pokemon in store with matching ownerId.
- **inputs**: ownerId string
- **outputs**: Pokemon[]
- **accessible_from**: gm

### pokemon-lifecycle-C060: library.groupedPokemonByLocation
- **cap_id**: pokemon-lifecycle-C060
- **name**: Pokemon Grouped by Location
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `groupedPokemonByLocation`
- **game_concept**: Location-based Pokemon organization
- **description**: Groups filteredPokemon by location field. Empty locations sorted last as "No Location". Returns array of { location, pokemon[] }.
- **inputs**: Derived from filteredPokemon
- **outputs**: Array<{ location: string, pokemon: Pokemon[] }>
- **accessible_from**: gm

### pokemon-lifecycle-C061: library.setFilters
- **cap_id**: pokemon-lifecycle-C061
- **name**: Set Library Filters
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `setFilters()`
- **game_concept**: Filter control for library UI
- **description**: Merges partial filter updates into current filters state (search, type, characterType, pokemonType, pokemonOrigin, sortBy, sortOrder). Immutable merge via spread.
- **inputs**: Partial<LibraryFilters>
- **outputs**: void (updates state)
- **accessible_from**: gm

---

## Composable Functions

### pokemon-lifecycle-C062: usePokemonSprite.getSpriteUrl
- **cap_id**: pokemon-lifecycle-C062
- **name**: Primary Sprite URL Generator
- **type**: composable-function
- **location**: `app/composables/usePokemonSprite.ts` -- `getSpriteUrl()`
- **game_concept**: Pokemon sprite display (B2W2 for Gen 1-5, Showdown for Gen 6+)
- **description**: Returns animated sprite URL. Gen 1-5 (dex <= 649): PokeAPI B2W2 animated GIF. Gen 6+: Pokemon Showdown animated GIF. Handles shiny variants. Maps special names via showdownNames lookup (regional forms, special characters).
- **inputs**: species string, shiny boolean
- **outputs**: URL string
- **accessible_from**: gm, player, group

### pokemon-lifecycle-C063: usePokemonSprite.getStaticSpriteUrl
- **cap_id**: pokemon-lifecycle-C063
- **name**: Static Sprite URL Generator
- **type**: composable-function
- **location**: `app/composables/usePokemonSprite.ts` -- `getStaticSpriteUrl()`
- **game_concept**: Fallback static sprite
- **description**: Returns static PNG sprite URL via PokeAPI dex number or PokemonDB name-based URL as last resort. Handles shiny variants.
- **inputs**: species string, shiny boolean
- **outputs**: URL string
- **accessible_from**: gm, player, group

### pokemon-lifecycle-C064: usePokemonSprite.getSpriteWithFallback
- **cap_id**: pokemon-lifecycle-C064
- **name**: Sprite URL with Fallback Chain
- **type**: composable-function
- **location**: `app/composables/usePokemonSprite.ts` -- `getSpriteWithFallback()`
- **game_concept**: Reliable sprite loading
- **description**: Async function. Tries multiple sprite sources in order: Showdown animated, PokeAPI BW animated, PokeAPI static. HEAD-checks each URL. Returns /images/pokemon-placeholder.svg if all fail.
- **inputs**: species string, shiny boolean
- **outputs**: Promise<URL string>
- **accessible_from**: gm, player, group

### pokemon-lifecycle-C065: usePokemonSprite.getDexNumber
- **cap_id**: pokemon-lifecycle-C065
- **name**: Species Dex Number Lookup
- **type**: composable-function
- **location**: `app/composables/usePokemonSprite.ts` -- `getDexNumber()`
- **game_concept**: National Pokedex number resolution
- **description**: Returns dex number from species name (Gen 1-5 complete: 649 entries). Returns null for unknown species.
- **inputs**: species string
- **outputs**: number | null
- **accessible_from**: gm, player, group

### pokemon-lifecycle-C066: usePokemonSheetRolls.rollSkill
- **cap_id**: pokemon-lifecycle-C066
- **name**: Pokemon Skill Roll
- **type**: composable-function
- **location**: `app/composables/usePokemonSheetRolls.ts` -- `rollSkill()`
- **game_concept**: Pokemon skill check dice roll
- **description**: Rolls dice notation for a skill check. Stores result in lastSkillRoll ref for display in PokemonSkillsTab.
- **inputs**: skill name string, dice notation string
- **outputs**: Sets lastSkillRoll reactive state
- **accessible_from**: gm

### pokemon-lifecycle-C067: usePokemonSheetRolls.rollAttack
- **cap_id**: pokemon-lifecycle-C067
- **name**: Pokemon Move Attack Roll
- **type**: composable-function
- **location**: `app/composables/usePokemonSheetRolls.ts` -- `rollAttack()`
- **game_concept**: PTU attack accuracy check (d20 vs AC)
- **description**: Rolls 1d20. Detects natural 20 (crit), natural 1 (miss), or compares to move AC for hit/miss. Stores result in lastMoveRoll with resultClass for styling.
- **inputs**: Move object
- **outputs**: Sets lastMoveRoll reactive state
- **accessible_from**: gm

### pokemon-lifecycle-C068: usePokemonSheetRolls.rollDamage
- **cap_id**: pokemon-lifecycle-C068
- **name**: Pokemon Move Damage Roll
- **type**: composable-function
- **location**: `app/composables/usePokemonSheetRolls.ts` -- `rollDamage()`
- **game_concept**: PTU damage roll with stat bonus
- **description**: Rolls damage dice from getDamageRoll(damageBase). Adds attack/specialAttack stat. For crits, uses rollCritical(). Updates lastMoveRoll with damage result and breakdown string.
- **inputs**: Move object, isCrit boolean
- **outputs**: Sets lastMoveRoll.damage reactive state
- **accessible_from**: gm

### pokemon-lifecycle-C069: usePokemonSheetRolls.getMoveDamageFormula
- **cap_id**: pokemon-lifecycle-C069
- **name**: Move Damage Formula Display
- **type**: composable-function
- **location**: `app/composables/usePokemonSheetRolls.ts` -- `getMoveDamageFormula()`
- **game_concept**: Damage dice + stat display
- **description**: Returns human-readable damage formula string (e.g., "2d6+10+12" for dice+stat). Returns '-' for status moves with no damageBase.
- **inputs**: Move object
- **outputs**: Formula string
- **accessible_from**: gm

### pokemon-lifecycle-C070: useCharacterExportImport.handleExport
- **cap_id**: pokemon-lifecycle-C070
- **name**: Character Export Handler
- **type**: composable-function
- **location**: `app/composables/useCharacterExportImport.ts` -- `handleExport()`
- **game_concept**: Download character + Pokemon as JSON
- **description**: Fetches GET /api/player/export/:characterId. Creates a Blob and triggers download with filename "{characterName}_export.json". Manages exporting/operationResult state.
- **inputs**: characterId (from ref), characterName (from ref)
- **outputs**: Browser download, operationResult state
- **accessible_from**: player

### pokemon-lifecycle-C071: useCharacterExportImport.handleImportFile
- **cap_id**: pokemon-lifecycle-C071
- **name**: Character Import Handler
- **type**: composable-function
- **location**: `app/composables/useCharacterExportImport.ts` -- `handleImportFile()`
- **game_concept**: Upload offline edits back to server
- **description**: Reads File as text, parses JSON, POSTs to /api/player/import/:characterId. Reports update counts and conflicts. Returns boolean indicating whether fields were updated. Manages importing/operationResult state.
- **inputs**: File object
- **outputs**: Promise<boolean>, operationResult state
- **accessible_from**: player

---

## Components

### pokemon-lifecycle-C072: PokemonEditForm
- **cap_id**: pokemon-lifecycle-C072
- **name**: Pokemon Header/Edit Form
- **type**: component
- **location**: `app/components/pokemon/PokemonEditForm.vue`
- **game_concept**: Pokemon identity display and editing
- **description**: Displays sprite (with shiny badge), species, nickname, level, experience, gender, shiny checkbox, location, and type badges. In edit mode, fields become editable inputs. Emits update:editData with immutable spread.
- **inputs**: pokemon, editData, isEditing, spriteUrl props
- **outputs**: Emits update:editData
- **accessible_from**: gm

### pokemon-lifecycle-C073: PokemonLevelUpPanel
- **cap_id**: pokemon-lifecycle-C073
- **name**: Level-Up Info Panel
- **type**: component
- **location**: `app/components/pokemon/PokemonLevelUpPanel.vue`
- **game_concept**: Preview level-up effects when editing level
- **description**: Shown in edit mode when targetLevel > currentLevel. Watches targetLevel and fetches POST /api/pokemon/:id/level-up-check. Displays stat points, tutor points, new moves, ability milestones, and evolution reminder. Animated slide-down appearance.
- **inputs**: pokemonId, currentLevel, targetLevel props
- **outputs**: Visual-only (fetches data internally)
- **accessible_from**: gm

### pokemon-lifecycle-C074: PokemonStatsTab
- **cap_id**: pokemon-lifecycle-C074
- **name**: Pokemon Stats Display/Edit Tab
- **type**: component
- **location**: `app/components/pokemon/PokemonStatsTab.vue`
- **game_concept**: Pokemon stat sheet with combat state
- **description**: 3-column grid showing base stats and current stats. HP editable in edit mode. Displays status conditions (color-coded badges), injuries (count badge), combat stage modifiers (positive/negative styling), and nature with raised/lowered stat indicators.
- **inputs**: pokemon, editData, isEditing props
- **outputs**: Emits update:editData for HP changes
- **accessible_from**: gm

### pokemon-lifecycle-C075: PokemonMovesTab
- **cap_id**: pokemon-lifecycle-C075
- **name**: Pokemon Moves Display with Rolls
- **type**: component
- **location**: `app/components/pokemon/PokemonMovesTab.vue`
- **game_concept**: Move cards with inline attack/damage rolling
- **description**: Lists all moves as cards showing name, type badge, class, frequency, AC, damage formula, range, and effect. Each card has Attack Roll (d20 vs AC), Damage Roll, and Crit Roll buttons. Displays last roll result with hit/miss/crit styling.
- **inputs**: pokemon, lastMoveRoll, getMoveDamageFormula props
- **outputs**: Emits roll-attack, roll-damage events
- **accessible_from**: gm

### pokemon-lifecycle-C076: PokemonCapabilitiesTab
- **cap_id**: pokemon-lifecycle-C076
- **name**: Pokemon Capabilities Display
- **type**: component
- **location**: `app/components/pokemon/PokemonCapabilitiesTab.vue`
- **game_concept**: PTU movement capabilities and other capabilities
- **description**: 3-column grid showing movement caps (overland, swim, sky, burrow, levitate), jump high/long, power, weight class, size. Lists other capabilities as tags.
- **inputs**: pokemon prop
- **outputs**: Visual-only
- **accessible_from**: gm

### pokemon-lifecycle-C077: PokemonSkillsTab
- **cap_id**: pokemon-lifecycle-C077
- **name**: Pokemon Skills Display with Rolls
- **type**: component
- **location**: `app/components/pokemon/PokemonSkillsTab.vue`
- **game_concept**: Pokemon skill checks with dice rolling
- **description**: 2-column grid of skills with dice notations. Clickable rows trigger skill rolls. Shows last roll result. Also displays tutor points, training exp, and egg groups.
- **inputs**: pokemon, lastSkillRoll props
- **outputs**: Emits roll-skill event
- **accessible_from**: gm

### pokemon-lifecycle-C078: XpDistributionModal
- **cap_id**: pokemon-lifecycle-C078
- **name**: Post-Combat XP Distribution Modal
- **type**: component
- **location**: `app/components/encounter/XpDistributionModal.vue`
- **game_concept**: Post-combat XP calculation and per-Pokemon distribution (Core p.460)
- **description**: Two-phase modal (configure -> results). Configure phase: shows defeated enemies with type tags, significance preset selector (or custom), player count (auto-detected from encounter), boss toggle, XP calculation summary. Groups player-side Pokemon by owner. Per-Pokemon XP input with level-up preview. Split Evenly button per player. Over-allocation validation. Apply sends to encounter.distributeXp(). Results phase shows XpDistributionResults + LevelUpNotification. Skip option available.
- **inputs**: encounter prop
- **outputs**: Emits skip, complete, close
- **accessible_from**: gm

---

## WebSocket Events

### pokemon-lifecycle-C079: character_update
- **cap_id**: pokemon-lifecycle-C079
- **name**: Character/Pokemon Update Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts` -- broadcast event
- **game_concept**: Real-time sync of entity changes
- **description**: Broadcast event relayed to all connected clients (gm, group, player). Sent after character or Pokemon updates. Clients receiving this event can refresh their local state.
- **inputs**: Entity update data
- **outputs**: Broadcast to all clients
- **accessible_from**: gm, group, player

---

## GM Page (Container)

### pokemon-lifecycle-C080: Pokemon Sheet Page
- **cap_id**: pokemon-lifecycle-C080
- **name**: GM Pokemon Detail Page
- **type**: component
- **location**: `app/pages/gm/pokemon/[id].vue`
- **game_concept**: Full Pokemon character sheet with editing
- **description**: Container page loading a single Pokemon by route param ID. Composes PokemonEditForm, PokemonLevelUpPanel, and tab components (Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes). Uses usePokemonSheetRolls() for dice rolling and usePokemonSprite() for sprite URL. Edit mode saves via library.updatePokemon(). Tabs: stats, moves, abilities, capabilities, skills, healing, notes.
- **inputs**: Route param: id, optional query: edit=true
- **outputs**: Full interactive Pokemon sheet
- **accessible_from**: gm

### pokemon-lifecycle-C081: XpDistributionResults
- **cap_id**: pokemon-lifecycle-C081
- **name**: XP Distribution Results Display
- **type**: component
- **location**: `app/components/encounter/XpDistributionResults.vue`
- **game_concept**: Post-XP-distribution summary
- **description**: Displays per-Pokemon XP results: species, XP gained, level change (highlighted if leveled). Shows total XP distributed. Conditionally renders LevelUpNotification for any Pokemon that leveled up.
- **inputs**: results: XpApplicationResult[], totalXpDistributed: number
- **outputs**: Visual-only
- **accessible_from**: gm

### pokemon-lifecycle-C082: LevelUpNotification
- **cap_id**: pokemon-lifecycle-C082
- **name**: Level-Up Notification Panel
- **type**: component
- **location**: `app/components/encounter/LevelUpNotification.vue`
- **game_concept**: Detailed level-up effects display
- **description**: Renders detailed level-up info for Pokemon that gained levels. Per Pokemon: stat points, tutor points, new moves, ability milestones (second at 20, third at 40), evolution eligibility. Uses Phosphor icons. Filters to only leveled-up Pokemon from XpApplicationResult array.
- **inputs**: results: XpApplicationResult[]
- **outputs**: Visual-only
- **accessible_from**: gm

---

## Capability Chains

### Chain 1: Manual Pokemon Creation
1. **GM** -> `library.createPokemon` (C050) -> `POST /api/pokemon` (C036) -> `resolveNickname` (C027) -> `serializePokemon` (C028) -> Pokemon record created -> Store updated
- **Accessible from**: gm

### Chain 2: Generated Pokemon Creation (Wild/Template)
1. **Server** -> `generateAndCreatePokemon` (C031) -> `generatePokemonData` (C029) [SpeciesData lookup, nature via NATURE_TABLE (C013), stat distribution (C033), move selection, ability pick] -> `createPokemonRecord` (C030) -> `resolveNickname` (C027) -> Pokemon record created
2. **For encounter insertion**: -> `buildPokemonCombatant` (C032) -> Combatant in encounter JSON
- **Accessible from**: gm (via encounter spawn endpoints)

### Chain 3: Pokemon Sheet Viewing & Editing
1. **GM** navigates to `/gm/pokemon/:id` (C080) -> `GET /api/pokemon/:id` (C035) -> `serializePokemon` (C028) -> Page rendered with `PokemonEditForm` (C072), tab components (C074-C077)
2. **GM** clicks Edit -> `PokemonLevelUpPanel` (C073) watches level changes -> `POST /api/pokemon/:id/level-up-check` (C043) -> `checkLevelUp` (C018) + `summarizeLevelUps` (C019) -> Panel shows new moves/abilities
3. **GM** saves -> `library.updatePokemon` (C051) -> `PUT /api/pokemon/:id` (C037) -> `serializePokemon` (C028) -> Store + page refreshed
- **Accessible from**: gm

### Chain 4: Trainer-Pokemon Linking
1. **GM** -> `library.linkPokemonToTrainer` (C053) -> `POST /api/pokemon/:id/link` (C039) -> ownerId set -> Store updated
2. **Or via capture**: Capture attempt endpoint auto-links on success (sets ownerId + origin='captured')
- **Accessible from**: gm

### Chain 5: Post-Combat XP Distribution
1. **GM** opens XpDistributionModal (C078) -> `encounter.calculateXp` (C055) -> `POST /api/encounters/:id/xp-calculate` (C044) -> `enrichDefeatedEnemies` (C022) + `calculateEncounterXp` (C020) -> Returns XP preview + participating Pokemon
2. **GM** adjusts significance (C015/C016), allocates XP per Pokemon, previews level-ups via `getLevelForXp` (C024)
3. **GM** clicks Apply -> `encounter.distributeXp` (C056) -> `POST /api/encounters/:id/xp-distribute` (C045) -> For each Pokemon: `calculateLevelUps` (C021) [-> `checkLevelUp` (C018)] -> Updates experience/level/tutorPoints/maxHp -> Marks encounter xpDistributed
4. **Results phase**: `XpDistributionResults` (C081) + `LevelUpNotification` (C082) display outcomes
- **Accessible from**: gm

### Chain 6: Manual XP Grant
1. **GM** -> `POST /api/pokemon/:id/add-experience` (C042) -> `calculateLevelUps` (C021) [-> `checkLevelUp` (C018)] -> Updates experience/level/tutorPoints/maxHp -> Returns XpApplicationResult
- **Accessible from**: gm

### Chain 7: Bulk Archive/Delete
1. **GM** -> `POST /api/pokemon/bulk-action` (C041) -> Safety check (active encounters) -> Archive (isInLibrary=false) or Delete -> Returns count
- **Accessible from**: gm

### Chain 8: Player Export/Import
1. **Player** -> `handleExport` (C070) -> `GET /api/player/export/:characterId` (C047) -> JSON download with character + Pokemon
2. **Player** -> `handleImportFile` (C071) -> `POST /api/player/import/:characterId` (C048) -> Zod validation -> Conflict detection -> Atomic DB update -> Returns update counts + conflicts
- **Accessible from**: player

### Chain 9: Sprite Resolution
1. **Any view** -> `usePokemonSprite().getSpriteUrl()` (C062) -> dex number lookup (C065) -> Gen 1-5: PokeAPI B2W2 GIF / Gen 6+: Showdown GIF
2. **Fallback**: `getSpriteWithFallback()` (C064) -> HEAD-checks multiple sources -> placeholder SVG as last resort
- **Accessible from**: gm, player, group

### Chain 10: Library Browsing & Filtering
1. **GM** -> `library.loadLibrary` (C049) -> Populates store
2. **GM** adjusts filters -> `library.setFilters` (C061) -> `filteredPokemon` getter (C057) applies search/type/origin/sort
3. **GM** clicks Pokemon -> navigates to sheet page (C080)
- **Accessible from**: gm

---

## Accessibility Summary

### GM View (`/gm`)
- **Full CRUD**: Create (C036/C050), Read (C034/C035), Update (C037/C051), Delete (C038/C052)
- **Linking**: Link/Unlink (C039-C040/C053-C054)
- **Bulk ops**: Archive/Delete (C041)
- **XP system**: Calculate (C044/C055), Distribute (C045/C056), Manual grant (C042)
- **Level-up**: Preview (C043/C073)
- **Sheet**: Full interactive sheet (C080) with tabs (C072-C077), dice rolling (C066-C069)
- **Library**: Filter, sort, browse (C049/C057-C061)
- **Sprites**: Full resolution (C062-C065)

### Group View (`/group`)
- **Read-only**: Pokemon data visible in encounter display (combatant entities)
- **Sprites**: Display sprites (C062-C065)
- **WebSocket**: Receives character_update events (C079)

### Player View (`/player`)
- **Read**: View own Pokemon on character sheet
- **Export/Import**: Download/upload character + Pokemon JSON (C047-C048/C070-C071)
- **Sprites**: Display sprites (C062-C065)
- **WebSocket**: Receives character_update events (C079)

### API-Only (No UI)
- **Services**: generatePokemonData (C029), createPokemonRecord (C030), generateAndCreatePokemon (C031), buildPokemonCombatant (C032), distributeStatPoints (C033)
- **Utilities**: applyNatureToBaseStats (C017), checkLevelUp (C018), summarizeLevelUps (C019), enrichDefeatedEnemies (C022), resolveNickname (C027), serializePokemon (C028)
- **Constants**: NATURE_TABLE (C013)
- **Models**: SpeciesData (C002)

---

## Missing Subsystems

1. **Evolution System**: No automated evolution detection or species transformation. Level-up check notes "check Pokedex entry" as a reminder but cannot detect evolution conditions (level, item, trade, etc.) because SpeciesData doesn't encode evolution triggers. GM must manually handle evolution.

2. **Stat Point Allocation UI**: Level-ups report stat points gained but there is no UI for the GM or player to allocate them following the Base Relations Rule. The GM must manually edit base stats via the PUT endpoint.

3. **Move Learning UI**: Level-up detection reports new moves available but there is no UI to add/replace moves on the Pokemon's active move list. The GM must manually edit the moves JSON.

4. **Breeding System**: eggGroups field exists on the Pokemon model and is populated at generation, but there is no breeding mechanic, egg creation, or inheritance logic.

5. **Training XP System**: trainingExp field exists on the Pokemon model but there is no endpoint or UI for daily training XP grants (PTU Core p.202: half Pokemon level + Command Rank bonus).

6. **Held Item Effects**: heldItem field stored as a string with no mechanical effect. No item database or item effect application during combat or rest.

7. **Ability Effect Application**: Abilities stored as { name, effect } text. No automated ability trigger detection or effect application during combat.

8. **Move Frequency Tracking (Pokemon Sheet)**: While extended-rest and pokemon-center endpoints handle move frequency reset, the Pokemon sheet's move tab has no frequency usage counter or exhaustion indicator visible to the GM.

9. **Multi-form Pokemon Management**: Species with alternate forms (Rotom appliances, Oricorio styles, Darmanitan Zen Mode) are parsed at seed time but there is no runtime form-change mechanic or UI.

10. **Pokedex Viewer**: SpeciesData is seeded and queryable via GET /api/species but there is no dedicated Pokedex browsing UI for the GM or players to look up species reference data.
