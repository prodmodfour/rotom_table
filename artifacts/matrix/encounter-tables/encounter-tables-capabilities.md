---
domain: encounter-tables
mapped_at: 2026-03-05T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 72
files_read: 32
---

# App Capabilities: Encounter Tables

> Re-mapped capability catalog for the encounter-tables domain.
> Includes all features through sessions 12-26: density significance P0-P2 (density as
> informational only, explicit spawn count), encounter budget P0-P1 (budget calculator,
> BudgetGuide, BudgetIndicator, significance presets), environment presets, diversity-enforced
> weighted random generation, JSON import/export, scene habitat integration, TV wild-spawn
> preview, encounter creation workflow, and dual habitat/encounter-table page sets.

## Prisma Models

### encounter-tables-C001
- **name:** EncounterTable Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model EncounterTable
- **game_concept:** PTU Habitat/encounter table for wild Pokemon spawning
- **description:** Root table storing name, description, imageUrl, level range (levelMin/levelMax), density tier (string, default "moderate"), and timestamps. Has relations to entries (EncounterTableEntry) and modifications (TableModification).
- **inputs:** name, description, imageUrl, levelMin, levelMax, density
- **outputs:** Persisted encounter table record
- **accessible_from:** gm

### encounter-tables-C002
- **name:** EncounterTableEntry Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model EncounterTableEntry
- **game_concept:** Weighted Pokemon species in an encounter table
- **description:** Links a species to a table with weight (spawn probability, Float default 10) and optional per-entry level range override. Unique constraint on (tableId, speciesId). FK to SpeciesData.
- **inputs:** tableId, speciesId, weight, levelMin, levelMax
- **outputs:** Persisted table entry with species relation
- **accessible_from:** gm

### encounter-tables-C003
- **name:** TableModification Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model TableModification
- **game_concept:** Sub-habitat modification of an encounter table
- **description:** Named modification that can add, remove, or re-weight species in the parent table's pool. Has optional level range override and densityMultiplier (Float default 1.0, currently unused -- density is informational only). Cascade deletes with parent.
- **inputs:** name, description, levelMin, levelMax, densityMultiplier, parentTableId
- **outputs:** Persisted modification record with child entries
- **accessible_from:** gm

### encounter-tables-C004
- **name:** ModificationEntry Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model ModificationEntry
- **game_concept:** Individual species override within a sub-habitat modification
- **description:** Per-species entry in a modification. Can override weight (add/reweight) or remove species (remove=true, weight=null). Uses speciesName string (not FK) to allow adding species not in parent. Unique constraint on (modificationId, speciesName). Cascade deletes with modification.
- **inputs:** modificationId, speciesName, weight, remove, levelMin, levelMax
- **outputs:** Persisted modification entry record
- **accessible_from:** gm

## Type Definitions

### encounter-tables-C005
- **name:** EncounterTable Type
- **type:** constant
- **location:** `app/types/habitat.ts` -- interface EncounterTable
- **game_concept:** Client-side encounter table shape
- **description:** TypeScript interface for encounter tables on the client. Includes id, name, description, imageUrl, levelRange ({min,max}), density (DensityTier), entries array, modifications array, timestamps.
- **inputs:** N/A (type definition)
- **outputs:** N/A (type definition)
- **accessible_from:** gm, group, player

### encounter-tables-C006
- **name:** EncounterTableEntry Type
- **type:** constant
- **location:** `app/types/habitat.ts` -- interface EncounterTableEntry
- **game_concept:** Client-side table entry shape
- **description:** TypeScript interface for entries. Includes id, speciesId, speciesName (denormalized), weight, optional levelRange override.
- **inputs:** N/A (type definition)
- **outputs:** N/A (type definition)
- **accessible_from:** gm, group, player

### encounter-tables-C007
- **name:** TableModification Type
- **type:** constant
- **location:** `app/types/habitat.ts` -- interface TableModification
- **game_concept:** Client-side modification shape
- **description:** TypeScript interface for modifications. Includes id, name, description, parentTableId, optional levelRange, entries array, timestamps. Note: densityMultiplier removed from type (density is informational only).
- **inputs:** N/A (type definition)
- **outputs:** N/A (type definition)
- **accessible_from:** gm, group, player

### encounter-tables-C008
- **name:** ModificationEntry Type
- **type:** constant
- **location:** `app/types/habitat.ts` -- interface ModificationEntry
- **game_concept:** Client-side modification entry shape
- **description:** TypeScript interface for modification entries. Includes id, speciesName, optional weight, remove boolean, optional levelRange.
- **inputs:** N/A (type definition)
- **outputs:** N/A (type definition)
- **accessible_from:** gm, group, player

### encounter-tables-C009
- **name:** ResolvedTableEntry Type
- **type:** constant
- **location:** `app/types/habitat.ts` -- interface ResolvedTableEntry
- **game_concept:** Computed entry after modification application
- **description:** Represents a species entry after parent+modification merge. Includes speciesName, optional speciesId, weight, levelRange, source ('parent'|'modification'|'added').
- **inputs:** N/A (type definition)
- **outputs:** N/A (type definition)
- **accessible_from:** gm

### encounter-tables-C010
- **name:** GeneratedPokemon Type
- **type:** constant
- **location:** `app/types/habitat.ts` -- interface GeneratedPokemon
- **game_concept:** Preview of randomly generated Pokemon before adding to encounter
- **description:** Represents a single generated Pokemon with speciesName, level, weight (for display), source, and rerolled flag.
- **inputs:** N/A (type definition)
- **outputs:** N/A (type definition)
- **accessible_from:** gm

### encounter-tables-C011
- **name:** RarityPreset Enum & RARITY_WEIGHTS Constant
- **type:** constant
- **location:** `app/types/habitat.ts` -- type RarityPreset, const RARITY_WEIGHTS
- **game_concept:** Standard rarity presets for encounter table entries
- **description:** Five rarity tiers (common=10, uncommon=5, rare=3, very-rare=1, legendary=0.1) used by the table editor when adding entries. Provides standardized weight values.
- **inputs:** N/A (constant)
- **outputs:** Weight number per rarity tier
- **accessible_from:** gm

### encounter-tables-C012
- **name:** DensityTier Enum & DENSITY_SUGGESTIONS Constant
- **type:** constant
- **location:** `app/types/habitat.ts` -- type DensityTier, const DENSITY_SUGGESTIONS
- **game_concept:** Population density labels for encounter tables (descriptive only)
- **description:** Four density tiers (sparse, moderate, dense, abundant) with suggested spawn counts and descriptions. Density is INFORMATIONAL ONLY -- does not mechanically control spawn count (per density/significance separation). Suggestions: sparse=2, moderate=4, dense=6, abundant=8.
- **inputs:** N/A (constant)
- **outputs:** Suggested spawn count and description per tier
- **accessible_from:** gm

### encounter-tables-C013
- **name:** MAX_SPAWN_COUNT Constant
- **type:** constant
- **location:** `app/types/habitat.ts` -- const MAX_SPAWN_COUNT = 20
- **game_concept:** Safety cap on spawn generation
- **description:** Hard cap of 20 Pokemon per generation request to prevent accidental massive generation. Enforced on both client (UI) and server (generate endpoint).
- **inputs:** N/A (constant)
- **outputs:** Maximum spawn count (20)
- **accessible_from:** gm

## API Endpoints

### encounter-tables-C014
- **name:** List All Tables
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/index.get.ts`
- **game_concept:** Retrieve all encounter tables for management
- **description:** GET /api/encounter-tables. Returns all tables with entries (including species data) and modification summaries, ordered by name ascending. Response serializes levelRange as {min,max} object.
- **inputs:** None
- **outputs:** Array of EncounterTable objects with entries and modifications
- **accessible_from:** gm

### encounter-tables-C015
- **name:** Create Table
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/index.post.ts`
- **game_concept:** Create new encounter table / habitat
- **description:** POST /api/encounter-tables. Creates a new table with name (required), description, imageUrl, levelRange, and density tier. Validates levelMin <= levelMax and density is one of valid values (defaults to 'moderate').
- **inputs:** name, description, imageUrl, levelRange.min, levelRange.max, density
- **outputs:** Created EncounterTable object
- **accessible_from:** gm

### encounter-tables-C016
- **name:** Get Table by ID
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id].get.ts`
- **game_concept:** Retrieve single table with full details
- **description:** GET /api/encounter-tables/:id. Returns a single table with all entries (including species data), modifications, and modification entries. 404 if not found.
- **inputs:** Table ID (URL param)
- **outputs:** EncounterTable object with full entry and modification data
- **accessible_from:** gm

### encounter-tables-C017
- **name:** Update Table
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id].put.ts`
- **game_concept:** Update table metadata (name, description, level range, density)
- **description:** PUT /api/encounter-tables/:id. Updates table fields. Validates levelMin <= levelMax, validates density if provided. Returns updated table with entries and modifications.
- **inputs:** Table ID (URL param), name, description, imageUrl, levelRange, density
- **outputs:** Updated EncounterTable object
- **accessible_from:** gm

### encounter-tables-C018
- **name:** Delete Table
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id].delete.ts`
- **game_concept:** Remove encounter table and all children
- **description:** DELETE /api/encounter-tables/:id. Cascade-deletes all entries and modifications. Returns success. 404 if not found.
- **inputs:** Table ID (URL param)
- **outputs:** { success: true }
- **accessible_from:** gm

### encounter-tables-C019
- **name:** Add Entry to Table
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/entries/index.post.ts`
- **game_concept:** Add a Pokemon species to an encounter table's pool
- **description:** POST /api/encounter-tables/:id/entries. Creates an entry linking a species to the table with weight and optional level range. Validates species exists, weight >= 0.1, levelMin <= levelMax, and no duplicate species. Defaults weight to 10.
- **inputs:** Table ID (URL param), speciesId, weight, levelRange
- **outputs:** Created EncounterTableEntry with species name
- **accessible_from:** gm

### encounter-tables-C020
- **name:** Update Entry in Table
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/entries/[entryId].put.ts`
- **game_concept:** Modify weight or level range of a table entry
- **description:** PUT /api/encounter-tables/:id/entries/:entryId. Partial update supporting weight and/or levelMin/levelMax. Merges provided values with existing DB values for cross-field validation (levelMin <= levelMax). Validates weight >= 0.1 and level 1-100.
- **inputs:** Table ID, Entry ID (URL params), weight, levelMin, levelMax
- **outputs:** Updated entry with species data
- **accessible_from:** gm

### encounter-tables-C021
- **name:** Delete Entry from Table
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/entries/[entryId].delete.ts`
- **game_concept:** Remove a Pokemon species from an encounter table
- **description:** DELETE /api/encounter-tables/:id/entries/:entryId. Verifies entry belongs to table before deletion. 404 if entry not found, 400 if entry does not belong to table.
- **inputs:** Table ID, Entry ID (URL params)
- **outputs:** { success: true }
- **accessible_from:** gm

### encounter-tables-C022
- **name:** Generate Encounter from Table
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/generate.post.ts`
- **game_concept:** Weighted random Pokemon generation from habitat pool
- **description:** POST /api/encounter-tables/:id/generate. Builds resolved entry pool (parent + optional modification), then calls encounter-generation.service for diversity-enforced weighted random selection. Count is provided by client (capped at MAX_SPAWN_COUNT, default 4). Density is reported in meta but does NOT determine count. Returns generated array and meta (tableName, density, spawnCount, poolSize, totalWeight).
- **inputs:** Table ID (URL param), count, modificationId, levelRange override
- **outputs:** { generated: GeneratedPokemon[], meta: { tableId, tableName, modificationId, levelRange, density, spawnCount, totalPoolSize, totalWeight } }
- **accessible_from:** gm

### encounter-tables-C023
- **name:** Export Table as JSON
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/export.get.ts`
- **game_concept:** Export encounter table for sharing/backup
- **description:** GET /api/encounter-tables/:id/export. Returns a portable JSON representation of the table (no internal IDs), including entries by speciesName, modifications, and their entries. Sets Content-Disposition header for browser download.
- **inputs:** Table ID (URL param)
- **outputs:** JSON file download with version, exportedAt, table data
- **accessible_from:** gm

### encounter-tables-C024
- **name:** Import Table from JSON
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/import.post.ts`
- **game_concept:** Import encounter table from exported JSON
- **description:** POST /api/encounter-tables/import. Validates import data structure (version, table name, level ranges at all levels). Looks up species by name, creates table with entries and modifications. Auto-deduplicates name if already exists (appends counter). Reports unmatched species as warnings.
- **inputs:** Import JSON object with version, table (name, entries, modifications)
- **outputs:** Created EncounterTable, warnings about unmatched species
- **accessible_from:** gm

### encounter-tables-C025
- **name:** List Modifications for Table
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/index.get.ts`
- **game_concept:** Retrieve all sub-habitats for a table
- **description:** GET /api/encounter-tables/:id/modifications. Returns all modifications with their entries, ordered by name. Verifies parent table exists.
- **inputs:** Table ID (URL param)
- **outputs:** Array of TableModification objects with entries
- **accessible_from:** gm

### encounter-tables-C026
- **name:** Create Modification
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/index.post.ts`
- **game_concept:** Create a new sub-habitat for an encounter table
- **description:** POST /api/encounter-tables/:id/modifications. Creates a modification with name (required), description, and optional level range override. Validates levelMin <= levelMax and parent table exists.
- **inputs:** Table ID (URL param), name, description, levelRange
- **outputs:** Created TableModification
- **accessible_from:** gm

### encounter-tables-C027
- **name:** Get Modification by ID
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId].get.ts`
- **game_concept:** Retrieve single modification with entries
- **description:** GET /api/encounter-tables/:id/modifications/:modId. Returns modification with all entries. Validates modification belongs to the specified table.
- **inputs:** Table ID, Modification ID (URL params)
- **outputs:** TableModification with entries
- **accessible_from:** gm

### encounter-tables-C028
- **name:** Update Modification
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId].put.ts`
- **game_concept:** Update sub-habitat metadata
- **description:** PUT /api/encounter-tables/:id/modifications/:modId. Partial update supporting name, description, levelRange. Merges provided level range with existing DB values for cross-field validation. Verifies modification belongs to table.
- **inputs:** Table ID, Modification ID (URL params), name, description, levelRange
- **outputs:** Updated TableModification with entries
- **accessible_from:** gm

### encounter-tables-C029
- **name:** Delete Modification
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId].delete.ts`
- **game_concept:** Remove sub-habitat and its entries
- **description:** DELETE /api/encounter-tables/:id/modifications/:modId. Cascade-deletes all modification entries. Validates modification belongs to table.
- **inputs:** Table ID, Modification ID (URL params)
- **outputs:** { success: true }
- **accessible_from:** gm

### encounter-tables-C030
- **name:** Add Entry to Modification
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts`
- **game_concept:** Add override/removal to a sub-habitat
- **description:** POST /api/encounter-tables/:id/modifications/:modId/entries. Creates a modification entry (override weight or remove species). Validates speciesName (required), weight >= 0.1 for non-remove entries, levelMin <= levelMax, and no duplicate species in modification.
- **inputs:** Table ID, Mod ID (URL params), speciesName, weight, remove, levelRange
- **outputs:** Created ModificationEntry
- **accessible_from:** gm

### encounter-tables-C031
- **name:** Delete Entry from Modification
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/[entryId].delete.ts`
- **game_concept:** Remove an override from a sub-habitat
- **description:** DELETE /api/encounter-tables/:id/modifications/:modId/entries/:entryId. Validates modification belongs to table and entry belongs to modification before deletion.
- **inputs:** Table ID, Mod ID, Entry ID (URL params)
- **outputs:** { success: true }
- **accessible_from:** gm

## Service Functions

### encounter-tables-C032
- **name:** generateEncounterPokemon
- **type:** service-function
- **location:** `app/server/services/encounter-generation.service.ts` -- generateEncounterPokemon()
- **game_concept:** Diversity-enforced weighted random Pokemon selection
- **description:** Pure function for encounter generation. Uses weighted random selection with diversity enforcement: each selection halves a species' effective weight (exponential decay), per-species cap of ceil(count/2) prevents any species from exceeding half the encounter. Skips diversity logic for single-species pools. Falls back to original weights when all species hit the cap. Injectable RNG for testing.
- **inputs:** GenerateEncounterInput { entries: PoolEntry[], count, levelMin, levelMax, randomFn? }
- **outputs:** GeneratedPokemon[] with speciesId, speciesName, level, weight, source
- **accessible_from:** gm (called by generate endpoint)

### encounter-tables-C033
- **name:** PoolEntry Type
- **type:** service-function
- **location:** `app/server/services/encounter-generation.service.ts` -- interface PoolEntry
- **game_concept:** Entry in the weighted generation pool
- **description:** Type for species pool entries used by the generation service. Includes speciesId, speciesName, weight, levelMin/levelMax (nullable), and source ('parent' | 'modification').
- **inputs:** N/A (type)
- **outputs:** N/A (type)
- **accessible_from:** gm

## Store (Pinia)

### encounter-tables-C034
- **name:** encounterTables Store
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- useEncounterTablesStore
- **game_concept:** Client-side state management for encounter tables
- **description:** Pinia store managing tables array, selectedTableId, loading/error state, and filter settings (search, sortBy, sortOrder). Central hub for all encounter table CRUD operations on the client.
- **inputs:** N/A (store definition)
- **outputs:** Reactive state, getters, actions
- **accessible_from:** gm

### encounter-tables-C035
- **name:** filteredTables Getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` -- filteredTables
- **game_concept:** Search and sort encounter tables
- **description:** Computed getter that filters tables by search text (matches name and description) and sorts by the selected field (name, createdAt, updatedAt) with configurable order (asc/desc).
- **inputs:** state.tables, state.filters
- **outputs:** Filtered and sorted EncounterTable[]
- **accessible_from:** gm

### encounter-tables-C036
- **name:** selectedTable Getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` -- selectedTable
- **game_concept:** Currently selected table for editing
- **description:** Returns the table matching selectedTableId from the tables array, or undefined if none selected.
- **inputs:** state.selectedTableId, state.tables
- **outputs:** EncounterTable | undefined
- **accessible_from:** gm

### encounter-tables-C037
- **name:** getTableById Getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` -- getTableById(id)
- **game_concept:** Look up table by ID
- **description:** Parameterized getter returning the table with the given ID from the cached array.
- **inputs:** Table ID
- **outputs:** EncounterTable | undefined
- **accessible_from:** gm

### encounter-tables-C038
- **name:** getResolvedEntries Getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` -- getResolvedEntries(tableId, modificationId?)
- **game_concept:** Compute effective encounter pool after modification
- **description:** Parameterized getter that starts with parent table entries, then optionally applies a modification (remove, override weight, add new). Returns array of ResolvedTableEntry with source tracking. Level range falls through: modEntry > modification > parentEntry > table default.
- **inputs:** tableId, optional modificationId
- **outputs:** ResolvedTableEntry[] with speciesName, speciesId, weight, levelRange, source
- **accessible_from:** gm

### encounter-tables-C039
- **name:** getTotalWeight Getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` -- getTotalWeight(tableId, modificationId?)
- **game_concept:** Total weight for probability display
- **description:** Parameterized getter that sums weights from getResolvedEntries to display total pool weight.
- **inputs:** tableId, optional modificationId
- **outputs:** Total weight number
- **accessible_from:** gm

### encounter-tables-C040
- **name:** loadTables Action
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- loadTables()
- **game_concept:** Fetch all encounter tables from server
- **description:** Calls GET /api/encounter-tables and replaces local tables array. Sets loading/error state.
- **inputs:** None
- **outputs:** Updates state.tables
- **accessible_from:** gm

### encounter-tables-C041
- **name:** loadTable Action
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- loadTable(id)
- **game_concept:** Fetch or refresh single table
- **description:** Calls GET /api/encounter-tables/:id. Updates existing entry in cache or adds new. Returns loaded table or null on error.
- **inputs:** Table ID
- **outputs:** EncounterTable | null
- **accessible_from:** gm

### encounter-tables-C042
- **name:** createTable / updateTable / deleteTable Actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- createTable(), updateTable(), deleteTable()
- **game_concept:** Table CRUD operations
- **description:** Three actions wrapping POST/PUT/DELETE for tables. createTable pushes to local array and returns created table. updateTable replaces in array by index. deleteTable removes from array and clears selection if deleted.
- **inputs:** Table data or ID
- **outputs:** Created/Updated EncounterTable or void
- **accessible_from:** gm

### encounter-tables-C043
- **name:** addEntry / updateEntry / removeEntry Actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- addEntry(), updateEntry(), removeEntry()
- **game_concept:** Entry CRUD on an encounter table
- **description:** Three actions for managing entries. addEntry POSTs and reloads table. updateEntry PUTs partial data (weight and/or levelRange) and patches local state. removeEntry DELETEs and filters from local entries array.
- **inputs:** tableId, entryId, data fields
- **outputs:** Created entry or void
- **accessible_from:** gm

### encounter-tables-C044
- **name:** createModification / updateModification / deleteModification Actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- createModification(), updateModification(), deleteModification()
- **game_concept:** Modification CRUD on an encounter table
- **description:** Three actions for managing modifications. createModification POSTs and appends to local table.modifications. updateModification PUTs and replaces in local array. deleteModification DELETEs and filters from local array.
- **inputs:** tableId, modId, data fields
- **outputs:** Created/Updated TableModification or void
- **accessible_from:** gm

### encounter-tables-C045
- **name:** addModificationEntry / removeModificationEntry Actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- addModificationEntry(), removeModificationEntry()
- **game_concept:** Add or remove entries within a modification
- **description:** Two actions for managing modification entries. addModificationEntry POSTs and reloads table. removeModificationEntry DELETEs and filters from local modification's entries array.
- **inputs:** tableId, modId, entryId, data fields
- **outputs:** Created ModificationEntry or void
- **accessible_from:** gm

### encounter-tables-C046
- **name:** generateFromTable Action
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- generateFromTable(tableId, options)
- **game_concept:** Generate wild Pokemon from encounter table
- **description:** Calls POST /api/encounter-tables/:id/generate with count, optional modificationId, optional levelRange override. Returns generated Pokemon array and meta data including density and spawn count.
- **inputs:** tableId, { count, modificationId?, levelRange? }
- **outputs:** { generated: GeneratedPokemon[], meta: { tableId, tableName, density, spawnCount, ... } }
- **accessible_from:** gm

### encounter-tables-C047
- **name:** exportTable / importTable Actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- exportTable(), importTable()
- **game_concept:** JSON import/export of encounter tables
- **description:** exportTable triggers browser download via window.location.href redirect. importTable POSTs JSON data, adds created table to local state, and returns warnings about unmatched species.
- **inputs:** tableId (export) or JSON data (import)
- **outputs:** void (export) or { table, warnings } (import)
- **accessible_from:** gm

### encounter-tables-C048
- **name:** selectTable / setFilters / resetFilters Actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- selectTable(), setFilters(), resetFilters()
- **game_concept:** UI state management for table selection and filtering
- **description:** selectTable sets selectedTableId. setFilters merges partial filter updates. resetFilters restores defaults (search='', sortBy='name', sortOrder='asc').
- **inputs:** Table ID or filter partial
- **outputs:** Updated state
- **accessible_from:** gm

## Composables

### encounter-tables-C049
- **name:** useTableEditor Composable
- **type:** composable-function
- **location:** `app/composables/useTableEditor.ts`
- **game_concept:** Full table editor workflow with form state and modals
- **description:** Composable managing the entire table editor experience. Provides: reactive table data, loading state, 4 modal visibility flags (addEntry, addMod, editMod, settings), form state for new entries (with rarity preset / custom weight), new modifications, edit modification, and edit settings. Computes totalWeight and sortedEntries. Methods: refreshTable, handleSpeciesSelect, addEntry, removeEntry, updateEntryWeight, updateEntryLevelRange, addModification, editModification, saveModification, deleteModification, saveSettings. Uses RARITY_WEIGHTS and DENSITY_SUGGESTIONS for rarity presets and density info. Sets page title reactively.
- **inputs:** tableId (Ref<string>)
- **outputs:** Reactive editor state, form data, computed values, action methods
- **accessible_from:** gm

### encounter-tables-C050
- **name:** useEncounterCreation Composable
- **type:** composable-function
- **location:** `app/composables/useEncounterCreation.ts`
- **game_concept:** Create encounter or add Pokemon to scene from generated results
- **description:** Composable encapsulating the "what do I do with generated Pokemon?" workflow. createWildEncounter() creates a new encounter with given Pokemon (calls encounterStore.createEncounter + addWildPokemon + serveEncounter, navigates to /gm). addToScene() POSTs each Pokemon to scene endpoint. Accepts optional significance tier for XP scaling. Returns creating/error state.
- **inputs:** Pokemon array, tableName, optional significance
- **outputs:** { creating, error, clearError, createWildEncounter, addToScene }
- **accessible_from:** gm

### encounter-tables-C051
- **name:** useEncounterBudget Composable
- **type:** composable-function
- **location:** `app/composables/useEncounterBudget.ts`
- **game_concept:** Reactive budget analysis for encounters
- **description:** Vue wrapper around encounterBudget.ts pure utility. Provides analyzeCurrent() which computes BudgetAnalysis for the active encounter by extracting player/enemy combatants from encounter store. Also re-exports the pure utility functions.
- **inputs:** averagePokemonLevel
- **outputs:** BudgetAnalysis | null, plus utility function re-exports
- **accessible_from:** gm

## Utility Functions

### encounter-tables-C052
- **name:** calculateEncounterBudget
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- calculateEncounterBudget()
- **game_concept:** PTU encounter level budget guideline (Chapter 11)
- **description:** Pure function. Calculates suggested total enemy levels for an encounter: average Pokemon level * 2 = baseline per player, * player count = total budget. This is a GM guideline for everyday encounters, not a hard formula.
- **inputs:** BudgetCalcInput { averagePokemonLevel, playerCount }
- **outputs:** BudgetCalcResult { totalBudget, levelBudgetPerPlayer, breakdown }
- **accessible_from:** gm

### encounter-tables-C053
- **name:** calculateEffectiveEnemyLevels
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- calculateEffectiveEnemyLevels()
- **game_concept:** PTU XP level counting (trainers count double, p.460)
- **description:** Pure function. Totals enemy levels, counting trainer levels as doubled per PTU rules.
- **inputs:** Array of { level, isTrainer }
- **outputs:** { totalLevels, effectiveLevels }
- **accessible_from:** gm

### encounter-tables-C054
- **name:** assessDifficulty
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- assessDifficulty()
- **game_concept:** Encounter difficulty assessment
- **description:** Pure function. Converts budget ratio to difficulty label using thresholds: trivial (<0.4), easy (0.4-0.7), balanced (0.7-1.3), hard (1.3-1.8), deadly (>1.8).
- **inputs:** budgetRatio (number)
- **outputs:** 'trivial' | 'easy' | 'balanced' | 'hard' | 'deadly'
- **accessible_from:** gm

### encounter-tables-C055
- **name:** analyzeEncounterBudget
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- analyzeEncounterBudget()
- **game_concept:** Full encounter budget analysis
- **description:** Pure function. Composes calculateEncounterBudget + calculateEffectiveEnemyLevels + assessDifficulty into a complete BudgetAnalysis.
- **inputs:** BudgetCalcInput, enemies array
- **outputs:** BudgetAnalysis { totalEnemyLevels, budget, budgetRatio, difficulty, hasTrainerEnemies, effectiveEnemyLevels }
- **accessible_from:** gm

### encounter-tables-C056
- **name:** calculateEncounterXp
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- calculateEncounterXp()
- **game_concept:** PTU encounter XP calculation (p.460)
- **description:** Pure function. Calculates XP from a completed encounter: effective enemy levels * significance multiplier / player count. Uses floor() for both total and per-player XP.
- **inputs:** enemies array, significanceMultiplier, playerCount
- **outputs:** { totalXp, xpPerPlayer, baseXp }
- **accessible_from:** gm

### encounter-tables-C057
- **name:** SIGNIFICANCE_PRESETS Constant
- **type:** constant
- **location:** `app/utils/encounterBudget.ts` -- SIGNIFICANCE_PRESETS
- **game_concept:** PTU encounter significance tiers for XP scaling
- **description:** Three presets: insignificant (x1.0, random wild), everyday (x2.0, standard trainer), significant (x5.0, gym leaders/legendaries). Capped at x5 per PTU Core p.460 and decree-030.
- **inputs:** N/A (constant)
- **outputs:** Array of SignificancePreset { tier, label, multiplierRange, defaultMultiplier, description }
- **accessible_from:** gm

### encounter-tables-C058
- **name:** DIFFICULTY_THRESHOLDS Constant
- **type:** constant
- **location:** `app/utils/encounterBudget.ts` -- DIFFICULTY_THRESHOLDS
- **game_concept:** App-specific difficulty assessment thresholds
- **description:** Budget ratio thresholds for difficulty labels: trivial (<0.4), easy (<0.7), balanced (<1.3), hard (<1.8), deadly (>=1.8).
- **inputs:** N/A (constant)
- **outputs:** Threshold values
- **accessible_from:** gm

## Components

### encounter-tables-C059
- **name:** TableCard Component
- **type:** component
- **location:** `app/components/encounter-table/TableCard.vue`
- **game_concept:** Card preview of an encounter table in the list view
- **description:** Displays table name, description, level range, density badge (color-coded), entry count, modification count, and top 5 entries by weight with rarity labels. Links to /gm/encounter-tables/:id editor page.
- **inputs:** table (EncounterTable prop)
- **outputs:** Navigation to table editor
- **accessible_from:** gm

### encounter-tables-C060
- **name:** EntryRow Component
- **type:** component
- **location:** `app/components/encounter-table/EntryRow.vue`
- **game_concept:** Editable row for a Pokemon entry in the table editor
- **description:** Grid row showing Pokemon sprite (via usePokemonSprite), species name, editable weight input, calculated encounter chance percentage, editable level range inputs (placeholder shows table default), and remove button. Emits update-weight, update-level-range, and remove events.
- **inputs:** entry (EncounterTableEntry), totalWeight, tableLevelRange
- **outputs:** Events: remove, update-weight, update-level-range
- **accessible_from:** gm

### encounter-tables-C061
- **name:** ModificationCard Component
- **type:** component
- **location:** `app/components/encounter-table/ModificationCard.vue`
- **game_concept:** Sub-habitat card with entry management
- **description:** Displays modification name, description, level range override, change count, and a list of changes with visual indicators (+add, -remove, swap-override). Includes a built-in modal for adding new modification entries via PokemonSearchInput with action type selection (override/remove). Emits edit and delete events.
- **inputs:** modification (TableModification), parentEntries, tableId
- **outputs:** Events: edit, delete; internal addModificationEntry calls to store
- **accessible_from:** gm

### encounter-tables-C062
- **name:** TableEditor Component
- **type:** component
- **location:** `app/components/encounter-table/TableEditor.vue`
- **game_concept:** Full table editor interface (shared by both page sets)
- **description:** Reusable editor component used by both /gm/encounter-tables/:id and /gm/habitats/:id. Wraps useTableEditor composable. Displays table info (description, level range, density badge with description, total weight), entries section with EntryRow components, modifications section with ModificationCard components. Has 4 modals: add entry (with rarity presets and custom weight), add modification, edit modification, and settings (name, description, levels, density). Provides named slots: header-actions and after for page-specific buttons and modals.
- **inputs:** tableId, backLink, backLabel (props)
- **outputs:** Rendered editor UI with slots
- **accessible_from:** gm

### encounter-tables-C063
- **name:** ImportTableModal Component
- **type:** component
- **location:** `app/components/encounter-table/ImportTableModal.vue`
- **game_concept:** JSON file import for encounter tables
- **description:** Modal with drag-and-drop or click-to-select file upload zone. Accepts .json files. Parses JSON, calls tablesStore.importTable(), shows import errors and species-matching warnings. Emits imported event with new table ID for navigation.
- **inputs:** None (modal)
- **outputs:** Events: close, imported(tableId)
- **accessible_from:** gm

### encounter-tables-C064
- **name:** EncounterTableCard Component (Habitat variant)
- **type:** component
- **location:** `app/components/habitat/EncounterTableCard.vue`
- **game_concept:** Card preview of table in the habitats list view
- **description:** Alternative card design used by /gm/habitats/ page. Shows image/placeholder, name, level range badge, density badge, species count, Pokemon sprite previews (top 8 by weight), and modification tags. Links to /gm/habitats/:id.
- **inputs:** table (EncounterTable)
- **outputs:** Navigation to habitat editor
- **accessible_from:** gm

### encounter-tables-C065
- **name:** EncounterTableModal Component (Habitat variant)
- **type:** component
- **location:** `app/components/habitat/EncounterTableModal.vue`
- **game_concept:** Create/edit encounter table modal (habitat page set)
- **description:** Multi-section modal for creating or editing tables. Basic info: name, description, level range, density selector (with DENSITY_SUGGESTIONS labels), image URL. When editing: species entries section with SpeciesAutocomplete and weight selector, modifications section with add/delete. Uses store actions directly for entry/modification CRUD.
- **inputs:** table? (EncounterTable, optional for edit mode)
- **outputs:** Events: close, save
- **accessible_from:** gm

### encounter-tables-C066
- **name:** GenerateEncounterModal Component
- **type:** component
- **location:** `app/components/habitat/GenerateEncounterModal.vue`
- **game_concept:** Generate and act on wild Pokemon from a habitat
- **description:** Core generation workflow modal. Features: table info display, BudgetGuide component (manual or prop-provided party context), spawn count input (with density-based suggestion), modification selector, optional level range override, significance tier radio selector (3 presets from encounterBudget), pool preview (top 10 resolved entries with percentage), generated Pokemon list with checkbox selection (select all/none), and 5 action buttons: Generate, Show on TV (serve to group), Clear TV, New Encounter (with significance), Add to Scene (with scene selector). Uses encounterTablesStore.generateFromTable, groupViewStore.serveWildSpawn, and emits addToEncounter/addToScene.
- **inputs:** table (EncounterTable), hasActiveEncounter, addError, addingToEncounter, scenes, partyContext (optional)
- **outputs:** Events: close, addToEncounter(pokemon, significance), addToScene(sceneId, pokemon)
- **accessible_from:** gm

### encounter-tables-C067
- **name:** BudgetGuide Component
- **type:** component
- **location:** `app/components/habitat/BudgetGuide.vue`
- **game_concept:** Encounter budget guidance during generation
- **description:** Inline budget calculator for the generation modal. Shows manual inputs (avg Pokemon level, player count) when no partyContext prop is provided. Displays budget formula (level x 2 x players = total) and delegates to BudgetIndicator for difficulty bar visualization when generated Pokemon exist.
- **inputs:** partyContext (optional), generatedPokemon array
- **outputs:** Visual budget guidance
- **accessible_from:** gm

### encounter-tables-C068
- **name:** BudgetIndicator Component
- **type:** component
- **location:** `app/components/encounter/BudgetIndicator.vue`
- **game_concept:** Visual difficulty bar for encounter budget
- **description:** Displays a progress bar comparing effective enemy levels to budget, with overflow striping for deadly encounters. Shows level ratio and color-coded difficulty label (trivial/easy/balanced/hard/deadly). Used by both GenerateEncounterModal and live encounter UI.
- **inputs:** analysis (BudgetAnalysis)
- **outputs:** Visual difficulty indicator
- **accessible_from:** gm

### encounter-tables-C069
- **name:** SceneHabitatPanel Component
- **type:** component
- **location:** `app/components/scene/SceneHabitatPanel.vue`
- **game_concept:** Scene-level encounter table integration
- **description:** Collapsible right sidebar in the scene editor. Allows linking a scene to an encounter table (habitat). Shows selected table info, generate random button (emits generate-encounter), and entry list with per-entry add button (rolls random level within range). Provides quick Pokemon addition to scenes from the habitat pool.
- **inputs:** encounterTables, sceneHabitatId, collapsed, generating
- **outputs:** Events: select-habitat, add-pokemon, generate-encounter, toggle-collapse
- **accessible_from:** gm

## Pages

### encounter-tables-C070
- **name:** Encounter Tables List Page
- **type:** component
- **location:** `app/pages/gm/encounter-tables.vue`
- **game_concept:** Main encounter tables management view
- **description:** GM page listing all encounter tables with search/sort/order filters, create table modal, generate modal (opened via ?generate=tableId query param), and import modal. Uses TableCard for display. Integrates with useEncounterCreation for creating encounters and adding to scenes.
- **inputs:** Route query params (generate=tableId)
- **outputs:** Navigation to table editors, encounter creation
- **accessible_from:** gm

### encounter-tables-C071
- **name:** Encounter Table Editor Page
- **type:** component
- **location:** `app/pages/gm/encounter-tables/[id].vue`
- **game_concept:** Single table editor (encounter-tables page set)
- **description:** Thin wrapper around EncounterTableTableEditor component. Adds a Generate button that navigates back to list page with ?generate=tableId query param.
- **inputs:** Route param: id
- **outputs:** Navigation to generate modal
- **accessible_from:** gm

### encounter-tables-C072
- **name:** Habitats List Page
- **type:** component
- **location:** `app/pages/gm/habitats/index.vue`
- **game_concept:** Alternative encounter tables list with richer cards
- **description:** GM page listing tables using EncounterTableCard (habitat variant). Has search, sort, create modal (EncounterTableModal), delete confirmation, and inline generate modal. Separate page set from /gm/encounter-tables with different visual design.
- **inputs:** None
- **outputs:** Navigation to habitat editors, encounter creation
- **accessible_from:** gm

### encounter-tables-C073
- **name:** Habitat Editor Page
- **type:** component
- **location:** `app/pages/gm/habitats/[id].vue`
- **game_concept:** Single habitat editor with generate and delete
- **description:** Wraps EncounterTableTableEditor with Generate and Delete action buttons, inline GenerateEncounterModal, and delete confirmation modal. Integrates scene addition via useEncounterCreation.addToScene.
- **inputs:** Route param: id
- **outputs:** Navigation, encounter creation, scene integration
- **accessible_from:** gm

## Seed Data

### encounter-tables-C074
- **name:** Encounter Tables Seed
- **type:** utility
- **location:** `app/prisma/seed-encounter-tables.ts`
- **game_concept:** Pre-built campaign habitats for Thickerby Forest, Phasmosa's Castle, Greywater Aqueduct, Bramblewick, Rivermere, and roads
- **description:** Seeds 12 encounter tables with species data, entries at 4 rarity tiers (common=60, uncommon=25, rare=10, veryRare=5), and modifications (Night, Day, Dusk/Night, Castle Shadow, Maintenance Tunnels). Upserts 35+ species into SpeciesData first. Skips tables that already exist.
- **inputs:** None (run as script)
- **outputs:** Database records for 12 tables with entries and modifications
- **accessible_from:** api-only (seed script)

---

## Capability Chains

### Chain 1: Table CRUD
**Component (List Page)** -> **Store (createTable/updateTable/deleteTable)** -> **API (POST/PUT/DELETE /encounter-tables)** -> **Prisma (EncounterTable)**
- Accessible from: **gm only**
- Both page sets (/gm/encounter-tables and /gm/habitats) use this chain

### Chain 2: Entry Management
**TableEditor -> EntryRow** -> **Composable (useTableEditor.addEntry/removeEntry/updateEntryWeight/updateEntryLevelRange)** -> **Store (addEntry/updateEntry/removeEntry)** -> **API (POST/PUT/DELETE /encounter-tables/:id/entries)** -> **Prisma (EncounterTableEntry)**
- Accessible from: **gm only**

### Chain 3: Modification Management
**TableEditor -> ModificationCard** -> **Composable (useTableEditor.addModification/editModification/saveModification/deleteModification)** -> **Store (createModification/updateModification/deleteModification)** -> **API (POST/PUT/DELETE /encounter-tables/:id/modifications)** -> **Prisma (TableModification)**
- Accessible from: **gm only**

### Chain 4: Modification Entry Management
**ModificationCard (add change modal)** -> **Store (addModificationEntry/removeModificationEntry)** -> **API (POST/DELETE /encounter-tables/:id/modifications/:modId/entries)** -> **Prisma (ModificationEntry)**
- Accessible from: **gm only**

### Chain 5: Pokemon Generation
**GenerateEncounterModal** -> **Store (generateFromTable)** -> **API (POST /encounter-tables/:id/generate)** -> **Service (encounter-generation.service generateEncounterPokemon)** -> **Prisma read (EncounterTable + entries + modifications)**
- Accessible from: **gm only**

### Chain 6: Encounter Creation from Generated Pokemon
**GenerateEncounterModal (addToEncounter)** -> **Composable (useEncounterCreation.createWildEncounter)** -> **encounterStore.createEncounter + addWildPokemon + serveEncounter** -> **API (multiple encounter endpoints)**
- Accessible from: **gm only**

### Chain 7: Scene Integration from Generated Pokemon
**GenerateEncounterModal (addToScene)** -> **Composable (useEncounterCreation.addToScene)** -> **API (POST /scenes/:id/pokemon)**
- Accessible from: **gm only**

### Chain 8: TV Wild Spawn Preview
**GenerateEncounterModal (serveToGroup/unserveFromTv)** -> **groupViewStore.serveWildSpawn / clearWildSpawnPreview** -> **API (POST/DELETE /group/wild-spawn)** -> **WebSocket broadcast to group view**
- Accessible from: **gm** (sends) -> **group** (displays)

### Chain 9: JSON Export/Import
**List Page (import button) -> ImportTableModal** -> **Store (importTable)** -> **API (POST /encounter-tables/import)** -> **Prisma (creates table + entries + modifications)**
**Store (exportTable)** -> **Browser redirect to GET /encounter-tables/:id/export** -> **JSON file download**
- Accessible from: **gm only**

### Chain 10: Resolved Entry Pool Preview
**GenerateEncounterModal (pool preview)** -> **Store Getter (getResolvedEntries)** -> Pure client-side computation (no API call)
- Accessible from: **gm only**

### Chain 11: Budget Guidance During Generation
**GenerateEncounterModal** -> **BudgetGuide** -> **Utils (calculateEncounterBudget, analyzeEncounterBudget)** -> **BudgetIndicator**
- Accessible from: **gm only**

### Chain 12: Scene Habitat Panel Quick-Add
**SceneHabitatPanel** -> emits add-pokemon -> **Scene page handler** -> **API (POST /scenes/:id/pokemon)**
- Accessible from: **gm only**

### Chain 13: Significance Selection for XP
**GenerateEncounterModal (significance radio)** -> **SIGNIFICANCE_PRESETS constant** -> passed to encounterCreation.createWildEncounter -> **encounterStore.createEncounter(name, type, undefined, significance)**
- Accessible from: **gm only**

---

## Accessibility Summary

| Access Level | Capabilities |
|---|---|
| **gm only** | C001-C004 (Prisma models -- GM creates/edits), C014-C031 (all API endpoints), C032-C033 (service), C034-C048 (all store capabilities), C049-C051 (composables), C052-C058 (utilities), C059-C073 (all components and pages) |
| **gm + group** | Chain 8: TV Wild Spawn Preview -- GM generates and serves, group view displays |
| **gm + group + player** | C005-C013 (type definitions -- imported anywhere but only used in GM context currently) |
| **api-only** | C074 (seed script) |
| **player** | None -- no encounter-table capabilities are accessible from the player view |
| **group** | Display-only via wild spawn preview (receives WebSocket broadcast) |

---

## Orphans

### Orphan 1: Habitats Page Set vs Encounter Tables Page Set
- **Description:** Two parallel page sets exist for the same domain: `/gm/habitats/` (uses EncounterTableCard, EncounterTableModal) and `/gm/encounter-tables/` (uses TableCard, inline create modal). Both are fully functional. The habitats page set has richer card design with sprites and image support; the encounter-tables page set has a cleaner filter bar with sort order. Both use the same store, same API endpoints, and the same TableEditor component for individual table editing.
- **Impact:** Not a bug -- these may be intentional alternate UIs, or the habitats set may be the newer replacement. Both work.

### Orphan 2: densityMultiplier on TableModification Prisma Model
- **Description:** The `densityMultiplier` field exists on the TableModification Prisma model (default 1.0) but is never read or written by any API endpoint, store action, composable, or component. The TypeScript type (habitat.ts) has a comment noting it was removed. This field is vestigial from before the density/significance separation.
- **Impact:** Dead schema field. No functional impact but adds confusion.

### Orphan 3: EncounterTableModal updateEntryWeight is a stub
- **Description:** In `components/habitat/EncounterTableModal.vue`, the `updateEntryWeight()` method has a TODO comment and only does `console.log`. Weight updates through this modal's entry list do not persist.
- **Impact:** Minor bug in the habitats page set. The encounter-tables page set uses TableEditor -> EntryRow which properly updates weights via useTableEditor.updateEntryWeight.

---

## Missing Subsystems

### Missing Subsystem 1: No Player-Facing Encounter Table Browsing
- **subsystem:** Players cannot browse available habitats or see what Pokemon might be encountered in their current area
- **actor:** player
- **ptu_basis:** PTU Ch.11 describes habitats as known areas with published encounter tables. Players often know what species inhabit a route before entering. In the video games, route information is common knowledge.
- **impact:** Low -- this is a GM-optional feature. Many GMs prefer to keep encounter tables secret. However, some GMs share partial information (e.g., "this forest is known for Bug and Grass types") and currently must do so verbally.

### Missing Subsystem 2: No Group View Encounter Table Display
- **subsystem:** The group/TV view cannot display encounter table information or the habitat being explored
- **actor:** gm (to display), group (to view)
- **ptu_basis:** When exploring a new area, the GM typically describes the habitat. A visual display of the area name, density description, and perhaps notable species would enhance the group viewing experience.
- **impact:** Low -- the wild spawn preview (Chain 8) partially addresses this by showing generated Pokemon on the TV, but there is no persistent habitat context display.

### Missing Subsystem 3: No Environment Preset Integration with Encounter Tables
- **subsystem:** Encounter tables have no connection to environment presets (EnvironmentPreset type exists in encounter.ts). When generating an encounter from a table, the encounter's environment effects (weather, terrain) are not auto-set based on the habitat.
- **actor:** gm
- **ptu_basis:** PTU habitats often have inherent environmental conditions (forest = grassy terrain, cave = dark, underwater = aquatic). These affect combat mechanically.
- **impact:** Medium -- GMs must manually set environment after creating an encounter from a habitat. This is a workflow gap, not a rules gap.
