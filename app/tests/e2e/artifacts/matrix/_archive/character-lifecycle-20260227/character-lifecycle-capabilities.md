---
domain: character-lifecycle
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 59
files_read: 38
---

# App Capabilities: Character Lifecycle

> Re-mapped capability catalog for the character-lifecycle domain.
> Includes new: trainer classes, class features, edge selection, biography, quick/full create modes, trainer sprites, character creation validation.

## Prisma Model

### character-lifecycle-C001
- **name:** HumanCharacter Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model HumanCharacter
- **game_concept:** Trainer / NPC data record
- **description:** Core data model for human characters (players, NPCs, trainers). Stores stats, classes, skills, features, edges, equipment, inventory, status conditions, stage modifiers, injuries, rest/healing tracking, AP pool, avatar, background/biography, and library membership.
- **inputs:** All fields defined on the model (id, name, characterType, playedBy, age, gender, height, weight, level, stats, currentHp, maxHp, trainerClasses, skills, features, edges, equipment, inventory, money, statusConditions, stageModifiers, injuries, temporaryHp, rest tracking fields, drainedAp, boundAp, currentAp, avatarUrl, background, personality, goals, location, isInLibrary, notes, pokemon relation)
- **outputs:** Persisted character record with all fields
- **accessible_from:** gm, player (read-only via player-view endpoint), api-only

### character-lifecycle-C002
- **name:** HumanCharacter.avatarUrl field
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.avatarUrl
- **game_concept:** Trainer sprite / avatar
- **description:** Optional string storing either a Showdown sprite key (e.g., 'acetrainer') or a full URL. Used by useTrainerSprite composable to resolve display URL.
- **inputs:** String (sprite key or URL) or null
- **outputs:** Persisted avatar reference
- **accessible_from:** gm, player

### character-lifecycle-C003
- **name:** HumanCharacter.trainerClasses field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.trainerClasses
- **game_concept:** PTU Trainer Classes (max 4)
- **description:** JSON-stringified array of class name strings. Stored as text, parsed on read.
- **inputs:** Array of class name strings
- **outputs:** JSON string in DB, parsed array on API read
- **accessible_from:** gm, player (read-only)

### character-lifecycle-C004
- **name:** HumanCharacter.skills field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.skills
- **game_concept:** PTU Trainer Skills (17 skills with ranks)
- **description:** JSON-stringified object mapping skill names to rank strings (Pathetic/Untrained/Novice/Adept/Expert/Master).
- **inputs:** Record<string, SkillRank>
- **outputs:** JSON string in DB, parsed object on API read
- **accessible_from:** gm, player (read-only)

### character-lifecycle-C005
- **name:** HumanCharacter.features field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.features
- **game_concept:** PTU Trainer Features
- **description:** JSON-stringified array of feature name strings. Includes class features and training feature.
- **inputs:** Array of feature name strings
- **outputs:** JSON string in DB, parsed array on API read
- **accessible_from:** gm, player (read-only)

### character-lifecycle-C006
- **name:** HumanCharacter.edges field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.edges
- **game_concept:** PTU Trainer Edges (including Skill Edges)
- **description:** JSON-stringified array of edge name strings. Skill Edges formatted as "Skill Edge: [Skill Name]".
- **inputs:** Array of edge name strings
- **outputs:** JSON string in DB, parsed array on API read
- **accessible_from:** gm, player (read-only)

### character-lifecycle-C007
- **name:** HumanCharacter.equipment field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.equipment
- **game_concept:** PTU Equipment Slots (head, body, mainHand, offHand, feet, accessory)
- **description:** JSON-stringified EquipmentSlots object mapping slot names to equipped item objects with bonuses.
- **inputs:** EquipmentSlots object
- **outputs:** JSON string in DB, parsed EquipmentSlots on API read
- **accessible_from:** gm, player (read-only)

## API Endpoints

### character-lifecycle-C010
- **name:** List Characters API
- **type:** api-endpoint
- **location:** `app/server/api/characters/index.get.ts`
- **game_concept:** Character library browsing
- **description:** Returns all characters where isInLibrary=true, ordered by name, with summary Pokemon data. Uses serializeCharacterSummary.
- **inputs:** None (no query params)
- **outputs:** `{ success, data: CharacterSummary[] }` — id, name, characterType, level, location, avatarUrl, pokemon summaries
- **accessible_from:** gm

### character-lifecycle-C011
- **name:** Create Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/index.post.ts`
- **game_concept:** Character creation
- **description:** Creates a new HumanCharacter with all PTU fields. Computes maxHp via PTU Trainer HP formula (Level * 2 + HP Stat * 3 + 10). Accepts nested stats object or flat stat fields. Stringifies JSON fields (classes, skills, features, edges, equipment, inventory, statusConditions, stageModifiers).
- **inputs:** Body: name, characterType, playedBy, age, gender, height, weight, level, stats/hp/attack/etc., maxHp, currentHp, trainerClasses[], skills{}, features[], edges[], equipment{}, inventory[], money, statusConditions[], stageModifiers{}, avatarUrl, background, personality, goals, location, isInLibrary, notes
- **outputs:** `{ success, data: Character }` — full serialized character with pokemon
- **accessible_from:** gm

### character-lifecycle-C012
- **name:** Get Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].get.ts`
- **game_concept:** Character sheet reading
- **description:** Returns a single character by ID with all linked Pokemon. Uses serializeCharacter for JSON field parsing.
- **inputs:** URL param: id
- **outputs:** `{ success, data: Character }` — full character with parsed JSON fields and pokemon
- **accessible_from:** gm, player

### character-lifecycle-C013
- **name:** Update Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].put.ts`
- **game_concept:** Character sheet editing
- **description:** Partial update of any character fields. Handles nested stats object, JSON-stringifies arrays/objects, validates AP fields against level-based maxAp with clamping. Imports calculateMaxAp from restHealing.
- **inputs:** URL param: id. Body: any subset of character fields
- **outputs:** `{ success, data: Character }` — updated character
- **accessible_from:** gm

### character-lifecycle-C014
- **name:** Delete Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].delete.ts`
- **game_concept:** Character removal
- **description:** Deletes a character. First unlinks all owned Pokemon (sets ownerId to null), then deletes the character record.
- **inputs:** URL param: id
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### character-lifecycle-C015
- **name:** List Player Characters API
- **type:** api-endpoint
- **location:** `app/server/api/characters/players.get.ts`
- **game_concept:** Player roster for encounters/scenes/player-identity
- **description:** Returns all characters where isInLibrary=true AND characterType='player', with full Pokemon team data (id, species, nickname, level, types, HP, shiny, sprite).
- **inputs:** None
- **outputs:** `{ success, data: PlayerCharacter[] }` — id, name, playedBy, level, currentHp, maxHp, avatarUrl, trainerClasses, pokemon[]
- **accessible_from:** gm, player

### character-lifecycle-C016
- **name:** CSV Import API
- **type:** api-endpoint
- **location:** `app/server/api/characters/import-csv.post.ts`
- **game_concept:** Bulk character import from PTU sheets
- **description:** Accepts raw CSV content, auto-detects sheet type (trainer or pokemon), parses fields, and creates the corresponding DB record. Trainer creation is direct; Pokemon creation routes through pokemon-generator.service.
- **inputs:** Body: { csvContent: string }
- **outputs:** `{ success, type: 'trainer'|'pokemon', data: Character|Pokemon }`
- **accessible_from:** gm

### character-lifecycle-C017
- **name:** Get Equipment API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/equipment.get.ts`
- **game_concept:** Equipment slot inspection
- **description:** Returns current equipment slots and computed aggregate combat bonuses (DR, evasion, stat bonuses, speed CS, conditional DR).
- **inputs:** URL param: id
- **outputs:** `{ success, data: { slots: EquipmentSlots, aggregateBonuses: EquipmentCombatBonuses } }`
- **accessible_from:** gm

### character-lifecycle-C018
- **name:** Update Equipment API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/equipment.put.ts`
- **game_concept:** Equip/unequip items
- **description:** Accepts partial equipment slot updates. Zod-validates each item (name, slot, DR, evasion, stat bonus, conditional DR, speed CS, readied bonuses, two-handed). Handles two-handed auto-clear logic. Returns updated slots and aggregate bonuses.
- **inputs:** URL param: id. Body: { slots: { [slotKey]: EquippedItem | null } }
- **outputs:** `{ success, data: { slots, aggregateBonuses } }`
- **accessible_from:** gm

### character-lifecycle-C019
- **name:** Character 30-min Rest API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/rest.post.ts`
- **game_concept:** PTU 30-minute rest healing
- **description:** Heals 1/16th maxHp. Blocked if 5+ injuries or daily rest limit (480 min) reached. Auto-resets daily counters if new day.
- **inputs:** URL param: id
- **outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **accessible_from:** gm

### character-lifecycle-C020
- **name:** Character Extended Rest API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/extended-rest.post.ts`
- **game_concept:** PTU 4+ hour extended rest
- **description:** Applies up to 8 rest periods (4 hours), clears persistent status conditions, restores all drained and bound AP to full maxAp.
- **inputs:** URL param: id
- **outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, clearedStatuses, apRestored, boundApCleared, restMinutes } }`
- **accessible_from:** gm

### character-lifecycle-C021
- **name:** Character Pokemon Center API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/pokemon-center.post.ts`
- **game_concept:** PTU Pokemon Center healing
- **description:** Full HP restoration, all status conditions cleared, injuries healed (max 3/day). Does NOT restore drained AP. Calculates effective max HP after injury reduction.
- **inputs:** URL param: id
- **outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, healingTime } }`
- **accessible_from:** gm

### character-lifecycle-C022
- **name:** Character Heal Injury API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/heal-injury.post.ts`
- **game_concept:** PTU injury healing (natural or AP drain)
- **description:** Heals one injury via natural method (24h since last injury) or drain_ap method (drains 2 AP). Daily limit of 3 injuries healed per day.
- **inputs:** URL param: id. Body: { method?: 'natural' | 'drain_ap' }
- **outputs:** `{ success, message, data: { injuriesHealed, injuries, drainedAp?, currentAp?, injuriesHealedToday } }`
- **accessible_from:** gm

### character-lifecycle-C023
- **name:** Character New Day API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/new-day.post.ts`
- **game_concept:** PTU daily reset for character
- **description:** Resets restMinutesToday, injuriesHealedToday, drained/bound AP to 0, currentAp to maxAp. Also resets daily counters and move frequency usage for all linked Pokemon.
- **inputs:** URL param: id
- **outputs:** `{ success, message, data: { restMinutesToday, injuriesHealedToday, drainedAp, boundAp, currentAp, pokemonReset } }`
- **accessible_from:** gm

### character-lifecycle-C024
- **name:** Character Player View API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/player-view.get.ts`
- **game_concept:** Player view data loading
- **description:** Returns full character data with all linked Pokemon in a single request. Designed for the Player View to load character sheet and Pokemon team simultaneously.
- **inputs:** URL param: id
- **outputs:** `{ success, data: { character: {..., pokemonIds}, pokemon: Pokemon[] } }`
- **accessible_from:** player, gm

## Services

### character-lifecycle-C030
- **name:** CSV Import Service — detectSheetType
- **type:** service-function
- **location:** `app/server/services/csv-import.service.ts` — detectSheetType()
- **game_concept:** PTU sheet type detection
- **description:** Analyzes CSV rows to determine if the sheet is a trainer sheet or pokemon sheet based on header patterns. Returns 'trainer', 'pokemon', or 'unknown'.
- **inputs:** string[][] (parsed CSV rows)
- **outputs:** 'trainer' | 'pokemon' | 'unknown'
- **accessible_from:** api-only (via import-csv endpoint)

### character-lifecycle-C031
- **name:** CSV Import Service — parseTrainerSheet / createTrainerFromCSV
- **type:** service-function
- **location:** `app/server/services/csv-import.service.ts` — parseTrainerSheet(), createTrainerFromCSV()
- **game_concept:** PTU trainer CSV parsing and DB creation
- **description:** Extracts trainer data from CSV rows (name, stats, skills, features, edges, equipment, background). Creates HumanCharacter DB record with properly computed maxHp and JSON-stringified fields.
- **inputs:** string[][] (parsed CSV rows)
- **outputs:** ParsedTrainer object → Created HumanCharacter record
- **accessible_from:** api-only (via import-csv endpoint)

## Store

### character-lifecycle-C040
- **name:** Library Store — loadLibrary action
- **type:** store-action
- **location:** `app/stores/library.ts` — useLibraryStore().loadLibrary()
- **game_concept:** Load all library entities
- **description:** Fetches all characters and Pokemon in parallel from /api/characters and /api/pokemon. Populates humans[] and pokemon[] state arrays.
- **inputs:** None
- **outputs:** Populates state.humans and state.pokemon
- **accessible_from:** gm

### character-lifecycle-C041
- **name:** Library Store — createHuman action
- **type:** store-action
- **location:** `app/stores/library.ts` — useLibraryStore().createHuman()
- **game_concept:** Create character via store
- **description:** POSTs to /api/characters, pushes result to local humans array.
- **inputs:** Partial<HumanCharacter> data
- **outputs:** Created HumanCharacter
- **accessible_from:** gm

### character-lifecycle-C042
- **name:** Library Store — updateHuman / deleteHuman actions
- **type:** store-action
- **location:** `app/stores/library.ts` — useLibraryStore().updateHuman(), deleteHuman()
- **game_concept:** Update/delete character via store
- **description:** PUTs to /api/characters/:id and updates local array, or DELETEs and filters out.
- **inputs:** id: string, data: Partial<HumanCharacter> (for update)
- **outputs:** Updated HumanCharacter (for update), void (for delete)
- **accessible_from:** gm

### character-lifecycle-C043
- **name:** Library Store — filteredHumans / filteredPlayers / groupedNpcsByLocation getters
- **type:** store-getter
- **location:** `app/stores/library.ts`
- **game_concept:** Character search/filter/grouping
- **description:** filteredHumans filters by search text and characterType, sorts by name/level. filteredPlayers returns player-only subset. groupedNpcsByLocation groups non-player characters by location field.
- **inputs:** state.filters (search, characterType, sortBy, sortOrder)
- **outputs:** HumanCharacter[] or grouped arrays
- **accessible_from:** gm

### character-lifecycle-C044
- **name:** Library Store — getHumanById getter
- **type:** store-getter
- **location:** `app/stores/library.ts` — useLibraryStore().getHumanById()
- **game_concept:** Character lookup
- **description:** Finds a character by ID in the local state array.
- **inputs:** id: string
- **outputs:** HumanCharacter | undefined
- **accessible_from:** gm

### character-lifecycle-C045
- **name:** Library Store — setFilters / resetFilters actions
- **type:** store-action
- **location:** `app/stores/library.ts` — useLibraryStore().setFilters() / resetFilters()
- **game_concept:** Library filter management
- **description:** Updates or resets filter state (search, type, characterType, pokemonType, pokemonOrigin, sortBy, sortOrder).
- **inputs:** Partial<LibraryFilters> or none (reset)
- **outputs:** Updated filters state
- **accessible_from:** gm

## Composables

### character-lifecycle-C050
- **name:** useCharacterCreation composable
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts`
- **game_concept:** PTU character creation flow
- **description:** Full character creation form state management. Provides reactive form state, stat point tracking (total/remaining/computed with PTU HP formula), background application (11 presets and custom mode), trainer class management (add/remove with max 4 cap), feature management (class features + training feature), edge management (add/remove/skill edges with rank bump and revert), validation warnings (stats, skills, classes/features/edges — soft warnings not hard blocks), section completion tracking for progress indicators, and API payload builder.
- **inputs:** User interactions with form fields
- **outputs:** form, computedStats, maxHp, evasions, statPointsUsed/Remaining, allWarnings, sectionCompletion, buildCreatePayload(), incrementStat, decrementStat, applyBackground, clearBackground, enableCustomBackground, setSkillRank, addClass, removeClass, addFeature, removeFeature, setTrainingFeature, addEdge, removeEdge, addSkillEdge
- **accessible_from:** gm

### character-lifecycle-C051
- **name:** useTrainerSprite composable
- **type:** composable-function
- **location:** `app/composables/useTrainerSprite.ts`
- **game_concept:** Trainer avatar URL resolution
- **description:** Converts sprite keys to Showdown CDN URLs. getTrainerSpriteUrl() handles null (returns null), full URLs (pass-through), and keys (constructs CDN URL). isSpriteKey() checks if value is a key vs URL.
- **inputs:** spriteKey: string | null | undefined
- **outputs:** Full URL string or null; isSpriteKey boolean; BASE_URL constant
- **accessible_from:** gm, group, player

## Constants

### character-lifecycle-C060
- **name:** TRAINER_CLASSES constant
- **type:** constant
- **location:** `app/constants/trainerClasses.ts`
- **game_concept:** PTU Trainer Class reference data (PTU Core Ch. 4, pp. 65-166)
- **description:** Array of 38 TrainerClassDef objects organized into 6 categories (Introductory: 6, Battling Style: 7, Specialist Team: 3, Professional: 5, Fighter: 9, Supernatural: 8). Each entry has name, category, associatedSkills[], description, optional isBranching flag. Exports TRAINER_CLASS_CATEGORIES[], MAX_TRAINER_CLASSES (4), getClassesByCategory() helper.
- **inputs:** N/A (static data)
- **outputs:** TrainerClassDef[], TrainerClassCategory[], MAX_TRAINER_CLASSES, getClassesByCategory()
- **accessible_from:** gm

### character-lifecycle-C061
- **name:** TRAINER_SPRITE_CATALOG constant
- **type:** constant
- **location:** `app/constants/trainerSprites.ts`
- **game_concept:** Trainer avatar selection catalog
- **description:** Array of ~180 curated Showdown trainer sprites organized into 9 categories (protagonists, gym-leaders, elite-champions, villains, grunts, generic-male, generic-female, specialists, other). Each entry has key, label, category. Also exports TRAINER_SPRITE_CATEGORIES[].
- **inputs:** N/A (static data)
- **outputs:** TrainerSprite[], TrainerSpriteCategory[]
- **accessible_from:** gm (picker), group+player (display via composable)

### character-lifecycle-C062
- **name:** PTU_SKILL_CATEGORIES / PTU_ALL_SKILLS constant
- **type:** constant
- **location:** `app/constants/trainerSkills.ts`
- **game_concept:** PTU 17 trainer skills (PTU Core p. 33)
- **description:** Skills organized by category (Body: 6, Mind: 7, Spirit: 4). SKILL_RANKS array with rank/value/dice. SKILL_RANK_LEVEL_REQS. getDefaultSkills() returns all Untrained.
- **inputs:** N/A (static data)
- **outputs:** PtuSkillName type, skill arrays, rank data, getDefaultSkills()
- **accessible_from:** gm

### character-lifecycle-C063
- **name:** Trainer Stats constants and functions
- **type:** constant
- **location:** `app/constants/trainerStats.ts`
- **game_concept:** PTU stat allocation rules (PTU Core Ch. 2)
- **description:** BASE_HP (10), BASE_OTHER (5), TOTAL_STAT_POINTS (10), MAX_POINTS_PER_STAT (5). Functions: getStatPointsForLevel(level), getMaxSkillRankForLevel(level), isSkillRankAboveCap(rank, level), getExpectedEdgesForLevel(level) returning {base, bonusSkillEdges, total}, getExpectedFeaturesForLevel(level).
- **inputs:** level: number
- **outputs:** Stat point budget, skill rank cap, edge/feature expectations
- **accessible_from:** gm

### character-lifecycle-C064
- **name:** SAMPLE_BACKGROUNDS constant
- **type:** constant
- **location:** `app/constants/trainerBackgrounds.ts`
- **game_concept:** PTU Background presets (PTU Core p. 14)
- **description:** 11 sample backgrounds from PTU Core. Each defines adeptSkill (PtuSkillName), noviceSkill (PtuSkillName), and 3 patheticSkills. Names: Fitness Training, Book Worm, Hermit, Old Timer, Quick and Small, Rough, Silver Tongued, Street Rattata, Super Nerd, Wild Child, At Least He's Pretty.
- **inputs:** N/A (static data)
- **outputs:** TrainerBackground[]
- **accessible_from:** gm

### character-lifecycle-C065
- **name:** EQUIPMENT_CATALOG constant
- **type:** constant
- **location:** `app/constants/equipment.ts`
- **game_concept:** PTU Standard Equipment (PTU Core p. 286-295)
- **description:** 15 catalog entries: Light/Heavy Armor, Stealth Clothes, Helmet, Dark Vision Goggles, Gas Mask, Light/Heavy Shield, Running Shoes, Snow Boots, 5 Focus variants. Exports EQUIPMENT_SLOTS (6), SLOT_LABELS, SLOT_ICONS (Phosphor), STAT_LABELS.
- **inputs:** N/A (static data)
- **outputs:** Record<string, EquippedItem>, slot/label/icon constants
- **accessible_from:** gm

## Utilities

### character-lifecycle-C070
- **name:** characterCreationValidation — validateStatAllocation
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts` — validateStatAllocation()
- **game_concept:** PTU stat allocation rule validation
- **description:** Checks total stat points against level budget and per-stat cap at level 1 (max 5). Returns CreationWarning[] with 'warning' or 'info' severity.
- **inputs:** statPoints: Record<string, number>, level: number
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via composable)

### character-lifecycle-C071
- **name:** characterCreationValidation — validateSkillBackground
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts` — validateSkillBackground()
- **game_concept:** PTU background skill allocation validation
- **description:** Validates 1 Adept, 1 Novice, 3 Pathetic counts. Checks skill rank cap by level. Downgrades severity to 'info' when Skill Edges modify counts. Shows level-specific skill rank cap info.
- **inputs:** skills: Record<string, string>, level: number, edges: string[]
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via composable)

### character-lifecycle-C072
- **name:** characterCreationValidation — validateEdgesAndFeatures
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts` — validateEdgesAndFeatures()
- **game_concept:** PTU edge/feature/class count validation
- **description:** Validates edge count against level-based expectations (base + bonus skill edges), feature count (level-based), class count (max 4). Includes milestone bonus guidance for levels 5+.
- **inputs:** edges[], features[], trainerClasses[], level
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via composable)

### character-lifecycle-C073
- **name:** computeEquipmentBonuses utility
- **type:** utility
- **location:** `app/utils/equipmentBonuses.ts` — computeEquipmentBonuses()
- **game_concept:** PTU equipment combat bonus aggregation
- **description:** Pure function computing aggregate combat bonuses from EquipmentSlots: total DR, evasion bonus, stat bonuses (Focus items — max 1 per PTU p.295), speed default CS, conditional DR entries.
- **inputs:** equipment: EquipmentSlots
- **outputs:** EquipmentCombatBonuses { damageReduction, evasionBonus, statBonuses, speedDefaultCS, conditionalDR }
- **accessible_from:** gm (via API and components)

## Components

### character-lifecycle-C080
- **name:** GM Create Page (Quick + Full modes)
- **type:** component
- **location:** `app/pages/gm/create.vue`
- **game_concept:** Character creation interface
- **description:** Full character creation page with human/pokemon type toggle. Human mode has Quick Create (minimal NPC scaffolding — name, type, level, location, sprite) and Full Create (PTU-compliant multi-section with section progress indicators). Full Create sections: Basic Info (name, type, level, location, trainer sprite), Background & Skills (via SkillBackgroundSection), Edges (via EdgeSelectionSection), Classes & Features (via ClassFeatureSection), Combat Stats (via StatAllocationSection), Biography (collapsible — age, gender, height, weight, story, personality, goals, money), Notes, Validation Summary. Uses useCharacterCreation composable. Pokemon form has species, nickname, level, gender, shiny, types, base stats.
- **inputs:** User form input
- **outputs:** Creates character via libraryStore.createHuman() or createPokemon(), navigates to /gm/sheets
- **accessible_from:** gm

### character-lifecycle-C081
- **name:** TrainerSpritePicker component
- **type:** component
- **location:** `app/components/character/TrainerSpritePicker.vue`
- **game_concept:** Trainer avatar selection modal
- **description:** Modal grid picker for ~180 trainer sprites. Features: 9 category filter tabs + All, text search (name/key substring), lazy image loading, broken image detection/filtering, local selection preview, clear/cancel/select actions. Renders sprites from Showdown CDN at 64x64.
- **inputs:** Props: modelValue (sprite key | null), show (boolean)
- **outputs:** Emits: update:modelValue (selected key or null), close
- **accessible_from:** gm

### character-lifecycle-C082
- **name:** CharacterModal component
- **type:** component
- **location:** `app/components/character/CharacterModal.vue`
- **game_concept:** Character/Pokemon sheet view/edit modal
- **description:** Full-sheet modal for viewing and editing characters or Pokemon. Tabbed interface for humans (Stats, Classes, Skills, Equipment, Pokemon, Notes) and Pokemon (Stats, Moves, Abilities, Capabilities, Skills, Notes).
- **inputs:** Props: character/pokemon data, isEditing flag
- **outputs:** Emits: close, save (with updated data)
- **accessible_from:** gm

### character-lifecycle-C083
- **name:** HumanCard component
- **type:** component
- **location:** `app/components/character/HumanCard.vue`
- **game_concept:** Character summary card in library
- **description:** Compact card showing character name, type badge, level, HP bar, avatar (sprite or letter initial), location, and linked Pokemon count.
- **inputs:** Props: character data
- **outputs:** Click events for selection/navigation
- **accessible_from:** gm

### character-lifecycle-C084
- **name:** HumanEquipmentTab component
- **type:** component
- **location:** `app/components/character/tabs/HumanEquipmentTab.vue`
- **game_concept:** Equipment slot management on character sheet
- **description:** Tab for equipping/unequipping items in 6 slots. Shows current items, catalog dropdown, custom item support, combat bonuses summary.
- **inputs:** Props: character equipment data, edit mode
- **outputs:** Equipment change events
- **accessible_from:** gm

### character-lifecycle-C085
- **name:** EquipmentCatalogBrowser component
- **type:** component
- **location:** `app/components/character/EquipmentCatalogBrowser.vue`
- **game_concept:** Equipment catalog browsing modal
- **description:** Modal browser for equipment catalog with slot filtering, search, and direct equip-to-character.
- **inputs:** Props: target character, current equipment
- **outputs:** Equip actions
- **accessible_from:** gm

### character-lifecycle-C086
- **name:** Character sheet tab components (Stats, Classes, Skills, Pokemon, Notes)
- **type:** component
- **location:** `app/components/character/tabs/HumanStatsTab.vue`, `HumanClassesTab.vue`, `HumanSkillsTab.vue`, `HumanPokemonTab.vue`, `NotesTab.vue`
- **game_concept:** Character sheet sections
- **description:** Individual tab components for the CharacterModal. HumanStatsTab shows HP, stats, evasions, injuries, AP. HumanClassesTab shows/edits trainer classes. HumanSkillsTab shows skill ranks by category. HumanPokemonTab shows linked Pokemon with link/unlink. NotesTab shows/edits freeform notes.
- **inputs:** Props: character data, edit mode
- **outputs:** Field update events
- **accessible_from:** gm

## Capability Chains

### Chain 1: Full Character Creation (GM)
`GM Create Page (C080, Full mode)` → `useCharacterCreation (C050)` → `validation utils (C070-C072)` + `constants (C060-C064)` → `Library Store createHuman (C041)` → `Create Character API (C011)` → `Prisma HumanCharacter (C001)`
- **Accessibility:** gm only
- **PTU coverage:** Stat allocation with budget tracking, background system (11 presets + custom), trainer classes (38 classes, 6 categories, max 4), features (class + training), edges (including Skill Edges with auto rank bump/revert), biography, trainer sprite selection from 180-sprite catalog, validation warnings

### Chain 2: Quick Character Creation (GM)
`GM Create Page (C080, Quick mode)` → `QuickCreateForm sub-component` → `Library Store createHuman (C041)` → `Create Character API (C011)` → `Prisma HumanCharacter (C001)`
- **Accessibility:** gm only
- **PTU coverage:** Minimal NPC scaffolding — name, type, level, location, sprite

### Chain 3: Character Sheet View/Edit (GM)
`GM Sheets Page` → `HumanCard (C083)` → `CharacterModal (C082)` → tab components (C084-C086) → `Library Store updateHuman (C042)` → `Update Character API (C013)` → `Prisma (C001)`
- **Accessibility:** gm only

### Chain 4: Equipment Management (GM)
`HumanEquipmentTab (C084)` / `EquipmentCatalogBrowser (C085)` → `Update Equipment API (C018)` → `computeEquipmentBonuses (C073)` → `Prisma (C007)`
- **Accessibility:** gm only

### Chain 5: Trainer Sprite Selection + Display
`TrainerSpritePicker (C081)` → sprite key saved to `avatarUrl (C002)` → `useTrainerSprite (C051)` resolves URL for display
- **Accessibility:** gm (selection via picker), gm+group+player (display via composable)

### Chain 6: Character Healing (GM)
`GM Character Sheet` → healing tab actions → `Rest/ExtRest/PokemonCenter/HealInjury/NewDay APIs (C019-C023)` → `Prisma (C001)`
- **Accessibility:** gm only

### Chain 7: CSV Import (GM)
`GM Sheets import` → `CSV Import API (C016)` → `CSV Import Service (C030-C031)` → `Prisma (C001)`
- **Accessibility:** gm only

### Chain 8: Character Library Browsing (GM)
`GM Sheets Page` → `Library Store loadLibrary/filteredHumans/groupedNpcsByLocation (C040, C043)` → `List Characters API (C010)` → `Prisma (C001)`
- **Accessibility:** gm only

### Chain 9: Player View Character Loading
`Player Page` → `Player View API (C024)` → serializes character + pokemon → client
- **Accessibility:** player (read-only), gm

### Chain 10: Character Creation Validation (client-side only)
`GM Create Page (C080)` → `useCharacterCreation validation computeds (C050)` → `validation utils (C070-C072)` → `trainerStats constants (C063)`
- **Accessibility:** gm only, pure client-side

## Accessibility Summary

| Access Level | Capability IDs |
|---|---|
| **gm-only** | C010, C011, C013, C014, C016, C017, C018, C019, C020, C021, C022, C023, C040-C045, C050, C060, C062-C065, C070-C073, C080-C086 |
| **gm+group+player** | C051 (useTrainerSprite display), C061 (sprite catalog display) |
| **gm+player** | C001-C007 (read-only for player), C012, C015, C024 |
| **api-only** | C030-C031 (CSV service functions — no direct UI, used via C016) |

## Missing Subsystems

### MS-1: No player-facing character sheet editing
- **subsystem:** Players cannot edit their own character sheets from the player view
- **actor:** player
- **ptu_basis:** PTU assumes players manage their own character sheets — updating stats on level-up, tracking money/inventory, managing equipment, editing skills/features/edges
- **impact:** GM must act as proxy for all character sheet changes. Players must verbally communicate changes and wait for GM to apply them. Bottleneck during level-up, shopping, and between-session bookkeeping.

### MS-2: No player-facing healing actions
- **subsystem:** Players cannot trigger rest, extended rest, Pokemon Center, or injury healing from their view
- **actor:** player
- **ptu_basis:** PTU rest mechanics are player-initiated decisions (when to rest, how long). Injury healing via AP drain is a trainer choice.
- **impact:** GM must manage all healing actions on behalf of players. Players cannot self-manage recovery during downtime.

### MS-3: No player-facing equipment management
- **subsystem:** Players cannot equip/unequip items or browse the equipment catalog from their view
- **actor:** player
- **ptu_basis:** PTU equipment is player-managed — trainers choose their loadout, buy items, equip before combat
- **impact:** GM must manage all equipment changes. Players cannot prepare their loadout independently.

### MS-4: No level-up workflow
- **subsystem:** No guided level-up process for either GM or player
- **actor:** both
- **ptu_basis:** PTU Core p. 19-21 defines specific level-up progression: +1 stat point, new features at odd levels, new edges at even levels, milestone bonuses at 5/10/20/30/40, skill rank cap unlocks at 2/6/12
- **impact:** Level-up requires manual knowledge of PTU rules and careful tracking. No guidance, no automated stat point budget increase, no feature/edge slot prompts.

### MS-5: No character advancement tracking
- **subsystem:** No XP, milestone, or progression tracking for human characters
- **actor:** both
- **ptu_basis:** PTU trainers gain levels through story milestones (GM awards level-ups). The system tracks Pokemon XP but not trainer progression.
- **impact:** GM must manually track trainer level advancement outside the app.
