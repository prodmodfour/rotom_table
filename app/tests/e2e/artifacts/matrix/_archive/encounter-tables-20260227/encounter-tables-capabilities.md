---
domain: encounter-tables
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 48
files_read: 28
---

# App Capabilities: Encounter Tables

> Re-mapped capability catalog for the encounter-tables domain.
> Includes new: density separated from spawn count, significance tier/presets (SIGNIFICANCE_PRESETS), encounter budget system (encounterBudget.ts, BudgetIndicator, useEncounterBudget), XP calculation.

## Prisma Models

### encounter-tables-C001
- **name:** EncounterTable Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model EncounterTable
- **game_concept:** PTU encounter table / habitat
- **description:** Weighted spawn table with name, description, imageUrl, default level range (levelMin/levelMax), population density tier, entries (EncounterTableEntry[]), and sub-habitat modifications (TableModification[]).
- **inputs:** name, description, imageUrl, levelMin, levelMax, density
- **outputs:** Persisted table record with entries and modifications
- **accessible_from:** gm

### encounter-tables-C002
- **name:** EncounterTableEntry Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model EncounterTableEntry
- **game_concept:** Pokemon species entry in encounter table
- **description:** Links a species (speciesId → SpeciesData) to a table with a weight (encounter probability) and optional level range override. Unique constraint on (tableId, speciesId).
- **inputs:** speciesId, weight, levelMin?, levelMax?, tableId
- **outputs:** Persisted entry record
- **accessible_from:** gm

### encounter-tables-C003
- **name:** TableModification Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model TableModification
- **game_concept:** Sub-habitat modification of parent encounter table
- **description:** Modifies a parent table's species pool: can add, remove, or override entries. Has own level range override, density multiplier (scales parent density), and nested ModificationEntry[] records.
- **inputs:** name, description, parentTableId, levelMin?, levelMax?, densityMultiplier
- **outputs:** Persisted modification with entries
- **accessible_from:** gm

### encounter-tables-C004
- **name:** ModificationEntry Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model ModificationEntry
- **game_concept:** Sub-habitat species override/add/remove
- **description:** Individual entry in a modification. speciesName (string, not FK — can add species not in parent). weight (overrides parent) or remove=true (excludes). Optional level range override.
- **inputs:** speciesName, weight?, remove, levelMin?, levelMax?, modificationId
- **outputs:** Persisted modification entry
- **accessible_from:** gm

## API Endpoints

### encounter-tables-C010
- **name:** List Encounter Tables API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/index.get.ts`
- **game_concept:** Browse encounter tables
- **description:** Returns all encounter tables with their entries and modifications.
- **inputs:** None
- **outputs:** `{ success, data: EncounterTable[] }`
- **accessible_from:** gm

### encounter-tables-C011
- **name:** Create Encounter Table API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/index.post.ts`
- **game_concept:** Create new encounter table
- **description:** Creates a new encounter table with name, description, imageUrl, level range, and density tier.
- **inputs:** Body: { name, description?, imageUrl?, levelRange?, density? }
- **outputs:** `{ success, data: EncounterTable }`
- **accessible_from:** gm

### encounter-tables-C012
- **name:** Get/Update/Delete Encounter Table APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id].get.ts`, `[id].put.ts`, `[id].delete.ts`
- **game_concept:** Single table CRUD
- **description:** Get returns table with all entries and modifications. Put updates name, description, imageUrl, level range, density. Delete cascades to all entries and modifications.
- **inputs:** URL param: id. Body (put): partial table fields
- **outputs:** `{ success, data: EncounterTable }` or `{ success: true }`
- **accessible_from:** gm

### encounter-tables-C013
- **name:** Add/Update/Remove Entry APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/entries/index.post.ts`, `[entryId].put.ts`, `[entryId].delete.ts`
- **game_concept:** Manage species entries in table
- **description:** Add species entry (speciesId + weight + optional level range), update weight/level range, or remove entry.
- **inputs:** URL params: id, entryId. Body: { speciesId, weight?, levelRange? } or { weight?, levelMin?, levelMax? }
- **outputs:** `{ success, data: EncounterTableEntry }` or `{ success: true }`
- **accessible_from:** gm

### encounter-tables-C014
- **name:** CRUD Modification (Sub-habitat) APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/` — index.get.ts, index.post.ts, [modId].get.ts, [modId].put.ts, [modId].delete.ts
- **game_concept:** Sub-habitat management
- **description:** List, create, get, update, delete sub-habitat modifications. Each modification can have its own name, description, level range override, and density multiplier.
- **inputs:** URL params: id, modId. Body: { name, description?, levelRange?, densityMultiplier? }
- **outputs:** `{ success, data: TableModification }` or `{ success: true }`
- **accessible_from:** gm

### encounter-tables-C015
- **name:** Add/Remove Modification Entry APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/` — index.post.ts, [entryId].delete.ts
- **game_concept:** Sub-habitat species pool changes
- **description:** Add species override (speciesName + weight), species addition (speciesName + weight for new species), or species removal (speciesName + remove=true). Remove deletes the modification entry.
- **inputs:** URL params: id, modId, entryId. Body: { speciesName, weight?, remove?, levelRange? }
- **outputs:** `{ success, data: ModificationEntry }` or `{ success: true }`
- **accessible_from:** gm

### encounter-tables-C016
- **name:** Generate Pokemon from Table API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/generate.post.ts`
- **game_concept:** Wild Pokemon encounter generation
- **description:** Generates Pokemon from table using diversity-enforced weighted random selection. Resolves species pool with optional modification applied, determines level range (override or table default). Uses encounter-generation.service for the actual selection. Returns generated list and metadata (table info, density, spawn count, pool size).
- **inputs:** URL param: id. Body: { count, modificationId?, levelRange? }
- **outputs:** `{ success, data: { generated: [...], meta: { tableId, tableName, density, spawnCount, totalPoolSize, totalWeight } } }`
- **accessible_from:** gm

### encounter-tables-C017
- **name:** Export/Import Table APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/export.get.ts`, `app/server/api/encounter-tables/import.post.ts`
- **game_concept:** Table JSON export/import
- **description:** Export downloads table as JSON file. Import creates a new table from JSON data, returns the created table and any warnings.
- **inputs:** Export: URL param id. Import: Body: JSON data object
- **outputs:** Export: JSON file download. Import: `{ data: EncounterTable, warnings: string | null }`
- **accessible_from:** gm

## Store

### encounter-tables-C020
- **name:** Encounter Tables Store — table CRUD actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — loadTables(), loadTable(), createTable(), updateTable(), deleteTable()
- **game_concept:** Encounter table state management
- **description:** Manages local table cache. loadTables fetches all, loadTable fetches/updates single, createTable/updateTable/deleteTable perform API operations and update local state.
- **inputs:** Table CRUD data
- **outputs:** Updated tables state
- **accessible_from:** gm

### encounter-tables-C021
- **name:** Encounter Tables Store — entry management actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — addEntry(), updateEntry(), removeEntry()
- **game_concept:** Table entry management via store
- **description:** Add/update/remove species entries from a table. Add and remove reload the full table; update modifies local state directly.
- **inputs:** tableId, entryId, entry data
- **outputs:** Updated table entries
- **accessible_from:** gm

### encounter-tables-C022
- **name:** Encounter Tables Store — modification management actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — createModification(), updateModification(), deleteModification(), addModificationEntry(), removeModificationEntry()
- **game_concept:** Sub-habitat management via store
- **description:** Full CRUD for modifications (sub-habitats) and their entries. Creates/updates/deletes modifications, adds/removes modification entries.
- **inputs:** tableId, modId, entryId, modification/entry data
- **outputs:** Updated modifications in local state
- **accessible_from:** gm

### encounter-tables-C023
- **name:** Encounter Tables Store — getResolvedEntries getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` — getResolvedEntries()
- **game_concept:** Resolved species pool after modification
- **description:** Computes final species pool by starting with parent entries and applying a modification (if specified): removes, overrides weights, adds new species. Each entry tagged with source ('parent', 'modification', 'added'). Level ranges cascade: entry → modification → table default.
- **inputs:** tableId, modificationId?
- **outputs:** ResolvedTableEntry[] with speciesName, weight, levelRange, source
- **accessible_from:** gm

### encounter-tables-C024
- **name:** Encounter Tables Store — getTotalWeight getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` — getTotalWeight()
- **game_concept:** Encounter probability calculation
- **description:** Sums weights of all resolved entries for a table (with optional modification). Used for probability percentage display.
- **inputs:** tableId, modificationId?
- **outputs:** number (total weight)
- **accessible_from:** gm

### encounter-tables-C025
- **name:** Encounter Tables Store — generateFromTable action
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — generateFromTable()
- **game_concept:** Wild Pokemon generation via store
- **description:** POSTs to generate endpoint with count, modificationId, levelRange options. Returns generated Pokemon list and metadata.
- **inputs:** tableId, { count, modificationId?, levelRange? }
- **outputs:** { generated: Array<{speciesId, speciesName, level, weight, source}>, meta: {...} }
- **accessible_from:** gm

### encounter-tables-C026
- **name:** Encounter Tables Store — export/import actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — exportTable(), importTable()
- **game_concept:** Table JSON export/import via store
- **description:** Export triggers browser download via URL navigation. Import POSTs JSON data and adds result to local state, returns table + warnings.
- **inputs:** tableId (export) or JSON data (import)
- **outputs:** void (export) or { table, warnings } (import)
- **accessible_from:** gm

### encounter-tables-C027
- **name:** Encounter Tables Store — filteredTables / filter actions
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` — filteredTables getter, setFilters(), resetFilters()
- **game_concept:** Table search/filter
- **description:** Filters tables by search (name, description) and sorts by name/createdAt/updatedAt.
- **inputs:** filters: { search, sortBy, sortOrder }
- **outputs:** EncounterTable[]
- **accessible_from:** gm

## Utilities (NEW)

### encounter-tables-C030
- **name:** calculateEncounterBudget utility
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` — calculateEncounterBudget()
- **game_concept:** PTU Level Budget formula (PTU Core p. 473)
- **description:** Pure function: averagePokemonLevel * 2 * playerCount = total level budget. Returns breakdown with per-player and total budget.
- **inputs:** BudgetCalcInput { averagePokemonLevel, playerCount }
- **outputs:** BudgetCalcResult { totalBudget, levelBudgetPerPlayer, breakdown }
- **accessible_from:** gm (via composable)

### encounter-tables-C031
- **name:** calculateEffectiveEnemyLevels utility
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` — calculateEffectiveEnemyLevels()
- **game_concept:** PTU XP rules — trainer levels count double (p. 460)
- **description:** Pure function: sums enemy levels, doubling trainer levels. Returns both raw total and effective (doubled) total.
- **inputs:** Array<{ level, isTrainer }>
- **outputs:** { totalLevels, effectiveLevels }
- **accessible_from:** gm (via composable)

### encounter-tables-C032
- **name:** analyzeEncounterBudget utility
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` — analyzeEncounterBudget()
- **game_concept:** Encounter difficulty assessment
- **description:** Full budget analysis combining budget calculation and enemy level analysis. Computes budgetRatio (effective enemy levels / total budget) and assesses difficulty: trivial (<0.4), easy (0.4-0.7), balanced (0.7-1.3), hard (1.3-1.8), deadly (>1.8).
- **inputs:** BudgetCalcInput, Array<{ level, isTrainer }>
- **outputs:** BudgetAnalysis { totalEnemyLevels, budget, budgetRatio, difficulty, hasTrainerEnemies, effectiveEnemyLevels }
- **accessible_from:** gm (via composable)

### encounter-tables-C033
- **name:** calculateEncounterXp utility
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` — calculateEncounterXp()
- **game_concept:** PTU XP calculation (PTU Core p. 460)
- **description:** Pure function: effectiveEnemyLevels * significanceMultiplier / playerCount. Returns totalXp, xpPerPlayer, and baseXp.
- **inputs:** Array<{ level, isTrainer }>, significanceMultiplier, playerCount
- **outputs:** { totalXp, xpPerPlayer, baseXp }
- **accessible_from:** gm (via composable)

### encounter-tables-C034
- **name:** SIGNIFICANCE_PRESETS constant
- **type:** constant
- **location:** `app/utils/encounterBudget.ts` — SIGNIFICANCE_PRESETS
- **game_concept:** PTU significance tiers for XP (PTU Core p. 460)
- **description:** 5 preset significance tiers: insignificant (x1-1.5), everyday (x2-3), significant (x3-4), climactic (x4-5), legendary (x5). Each with tier key, label, multiplier range, default multiplier, and description.
- **inputs:** N/A (static data)
- **outputs:** SignificancePreset[]
- **accessible_from:** gm

### encounter-tables-C035
- **name:** DIFFICULTY_THRESHOLDS constant
- **type:** constant
- **location:** `app/utils/encounterBudget.ts` — DIFFICULTY_THRESHOLDS
- **game_concept:** Budget ratio difficulty bands
- **description:** Threshold values for difficulty assessment: trivial <0.4, easy 0.4-0.7, balanced 0.7-1.3, hard 1.3-1.8, deadly >1.8.
- **inputs:** N/A (static data)
- **outputs:** Threshold object
- **accessible_from:** gm

## Composables (NEW)

### encounter-tables-C040
- **name:** useEncounterBudget composable
- **type:** composable-function
- **location:** `app/composables/useEncounterBudget.ts`
- **game_concept:** Reactive encounter budget analysis
- **description:** Wraps encounterBudget.ts for Vue components. analyzeCurrent(averagePokemonLevel) computes BudgetAnalysis for the active encounter by extracting player count and enemy levels from the encounter store. Also re-exports all pure utility functions.
- **inputs:** averagePokemonLevel: number
- **outputs:** BudgetAnalysis | null; plus calculateEncounterBudget, calculateEffectiveEnemyLevels, analyzeEncounterBudget, calculateEncounterXp
- **accessible_from:** gm

## Components

### encounter-tables-C045
- **name:** BudgetIndicator component (NEW)
- **type:** component
- **location:** `app/components/encounter/BudgetIndicator.vue`
- **game_concept:** Visual encounter difficulty indicator
- **description:** Displays budget analysis as a progress bar with difficulty coloring. Shows effective enemy levels vs total budget, trainer x2 note, and difficulty label (Trivial/Easy/Balanced/Hard/Deadly). Bar has fill and overflow segments.
- **inputs:** Props: { analysis: BudgetAnalysis }
- **outputs:** Visual display only
- **accessible_from:** gm

### encounter-tables-C046
- **name:** SignificancePanel component
- **type:** component
- **location:** `app/components/encounter/SignificancePanel.vue`
- **game_concept:** Encounter significance/XP configuration
- **description:** Panel for setting encounter significance tier (preset selector + custom multiplier), difficulty adjustment slider, and XP breakdown display. Uses SIGNIFICANCE_PRESETS for preset options. Updates encounter significance via API.
- **inputs:** Encounter significance state
- **outputs:** Significance tier and multiplier changes
- **accessible_from:** gm

### encounter-tables-C047
- **name:** TableEditor component
- **type:** component
- **location:** `app/components/encounter-table/TableEditor.vue`
- **game_concept:** Encounter table editing interface
- **description:** Full editor for encounter table: name, description, level range, density tier, species entries (add/remove/edit weight/level), sub-habitat modifications, generate button.
- **inputs:** Table data
- **outputs:** Table/entry/modification CRUD events
- **accessible_from:** gm

### encounter-tables-C048
- **name:** TableCard / EntryRow / ModificationCard / ImportTableModal components
- **type:** component
- **location:** `app/components/encounter-table/TableCard.vue`, `EntryRow.vue`, `ModificationCard.vue`, `ImportTableModal.vue`
- **game_concept:** Encounter table UI building blocks
- **description:** TableCard: summary card for table list. EntryRow: single species entry with weight/level display and edit controls. ModificationCard: sub-habitat card with entries. ImportTableModal: JSON file upload for table import.
- **inputs:** Respective data props
- **outputs:** Click/edit/delete events
- **accessible_from:** gm

## Capability Chains

### Chain 1: Encounter Table CRUD
`GM Encounter Tables Page` → `TableCard (C048)` → `Encounter Tables Store CRUD (C020)` → `Table CRUD APIs (C010-C012)` → `Prisma EncounterTable (C001)`
- **Accessibility:** gm only

### Chain 2: Species Entry Management
`TableEditor (C047)` → `EntryRow (C048)` → `Store entry actions (C021)` → `Entry APIs (C013)` → `Prisma EncounterTableEntry (C002)`
- **Accessibility:** gm only

### Chain 3: Sub-habitat Management
`TableEditor (C047)` → `ModificationCard (C048)` → `Store modification actions (C022)` → `Modification APIs (C014-C015)` → `Prisma TableModification/ModificationEntry (C003-C004)`
- **Accessibility:** gm only

### Chain 4: Pokemon Generation
`TableEditor (C047)` → `Store generateFromTable (C025)` → `Generate API (C016)` → encounter-generation.service → weighted random selection
- **Accessibility:** gm only

### Chain 5: Table Export/Import
`GM Encounter Tables Page` → `ImportTableModal (C048)` / export button → `Store export/import (C026)` → `Export/Import APIs (C017)`
- **Accessibility:** gm only

### Chain 6: Encounter Budget Analysis (NEW)
`GM Encounter Page` → `BudgetIndicator (C045)` → `useEncounterBudget (C040)` → `analyzeEncounterBudget (C032)` → `calculateEncounterBudget (C030)` + `calculateEffectiveEnemyLevels (C031)`
- **Accessibility:** gm only

### Chain 7: Significance & XP (NEW)
`SignificancePanel (C046)` → significance PUT API → Encounter model significanceMultiplier/Tier → `calculateEncounterXp (C033)` → XP distribution flow
- **Accessibility:** gm only

### Chain 8: Resolved Entry Pool
`Store getResolvedEntries (C023)` + `getTotalWeight (C024)` → used by TableEditor and generation for species pool resolution with modification overlay
- **Accessibility:** gm only (client-side computation)

## Accessibility Summary

| Access Level | Capability IDs |
|---|---|
| **gm-only** | All capabilities (C001-C048) |
| **api-only** | None (all endpoints are used by GM UI) |

## Missing Subsystems

### MS-1: No player-facing encounter table browsing
- **subsystem:** Players cannot view or interact with encounter tables
- **actor:** player
- **ptu_basis:** Encounter tables are a GM tool in PTU; players don't typically interact with them. This is working as intended for PTU.
- **impact:** Low — encounter tables are inherently a GM preparation tool.

### MS-2: No wild Pokemon tracking post-generation
- **subsystem:** Generated wild Pokemon from tables are not automatically tracked or linked back to the table they came from
- **actor:** gm
- **ptu_basis:** PTU GMs may want to review what was previously generated from a habitat for consistency
- **impact:** GM has no generation history — each generation is ephemeral.

### MS-3: No encounter budget integration in table generation
- **subsystem:** When generating from encounter tables, there is no budget-awareness — the table generates a count of Pokemon without considering the party's level budget
- **actor:** gm
- **ptu_basis:** PTU Core p. 473 suggests building encounters within a level budget. Table generation generates by count, not by budget.
- **impact:** GM must manually assess whether generated Pokemon fit the party's level budget by checking the BudgetIndicator after adding them to an encounter.
