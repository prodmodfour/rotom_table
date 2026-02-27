---
cap_id: character-lifecycle-C086
name: character-lifecycle-C086
type: —
domain: character-lifecycle
---

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
