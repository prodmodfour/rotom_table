---
cap_id: encounter-tables-C048
name: encounter-tables-C048
type: —
domain: encounter-tables
---

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
