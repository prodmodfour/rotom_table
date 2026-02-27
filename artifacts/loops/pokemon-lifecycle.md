# Pokemon Lifecycle — Gameplay Loops

Domain: `pokemon-lifecycle`
Generated: 2026-02-18
PTU Refs: `core/05-pokemon.md`, `books/markdown/errata-2.md`

---

## Tier 1: Session Workflows

---

### W1: GM Spawns Wild Pokemon into an Encounter

---
loop_id: pokemon-lifecycle-workflow-wild-spawn
tier: workflow
domain: pokemon-lifecycle
gm_intent: Populate an active encounter with auto-generated wild Pokemon opponents
ptu_refs:
  - core/05-pokemon.md#managing-pokemon-combat-stats
  - core/05-pokemon.md#managing-pokemon-moves
  - core/05-pokemon.md#managing-pokemon-abilities
app_features:
  - server/services/pokemon-generator.service.ts
  - server/api/encounters/[id]/wild-spawn.post.ts
  - server/services/grid-placement.service.ts
mechanics_exercised:
  - hp-formula
  - stat-point-distribution
  - move-selection-from-learnset
  - ability-assignment
  - nickname-resolution
  - species-data-lookup
  - capability-inheritance
  - skill-inheritance
  - gender-determination
  - token-placement
sub_workflows:
  - pokemon-lifecycle-workflow-capture (W3 — if the GM later wants a player to capture one)
---

## GM Context
Mid-session, the GM needs wild Pokemon opponents in an encounter. This is the most common Pokemon creation path — it runs whenever the GM spawns from an encounter table or adds wild Pokemon manually to a running encounter.

## Preconditions
- An active encounter exists (created and optionally started)
- SpeciesData is seeded in the database (species base stats, learnsets, abilities, capabilities)
- MoveData is seeded (move definitions for learnset lookups)

## Workflow Steps
1. **[Setup]** GM has an active encounter open in the GM view (`/gm`)
2. **[Action]** GM triggers wild spawn — either from an encounter table generation or directly adding species + level
3. **[Mechanic: species-data-lookup]** Server looks up `SpeciesData` by species name — retrieves base stats, types, learnset, abilities, capabilities, skills, size, weight class, egg groups, evolution stages
4. **[Mechanic: stat-point-distribution]** `distributeStatPoints()` allocates `level - 1` points weighted by base stat proportions across all 6 stats. Each point is randomly assigned via cumulative distribution
5. **[Mechanic: hp-formula]** Max HP calculated: `level + (calculatedHp * 3) + 10`. Current HP set to max HP
6. **[Mechanic: move-selection-from-learnset]** `selectMovesFromLearnset()` filters species learnset to entries at or below the Pokemon's level, takes the last 6 (most recently learned), and looks up each in MoveData for full move definitions
7. **[Mechanic: ability-assignment]** `pickRandomAbility()` selects one random ability from the first 2 in the species' basic ability list
8. **[Mechanic: nickname-resolution]** `resolveNickname()` auto-generates a sequential name (e.g., "Zubat 3") by counting existing Pokemon of that species
9. **[Mechanic: gender-determination]** Random 50/50 Male/Female assignment (species gender ratios not implemented)
10. **[Mechanic: capability-inheritance]** Capabilities (overland, swim, sky, burrow, levitate, jump, power, weight class, size, naturewalk, other) copied from SpeciesData
11. **[Mechanic: skill-inheritance]** Skills copied from SpeciesData
12. **[Bookkeeping]** Pokemon DB record created with `origin: 'wild'`, `isInLibrary: true`, nature defaults to Hardy (neutral), combat stages all 0, no status conditions, 0 injuries
13. **[Action]** `buildPokemonCombatant()` wraps the Pokemon into a combatant with the specified side (default: enemies) and a grid position found by `findPlacementPosition()`
14. **[Done]** Encounter updated with new combatant(s). Pokemon appears on the VTT grid with correct token size derived from species size

## PTU Rules Applied
- HP Formula: "Pokemon Hit Points = Pokemon Level + (HP x 3) + 10" (core/05-pokemon.md, Managing Pokemon — Combat Stats)
- Stat Points: "Next, add +X Stat Points, where X is the Pokemon's Level plus 10" — app uses `level - 1` points because base stats already represent the species defaults; net effect is the same distribution (core/05-pokemon.md, Managing Pokemon — Combat Stats)
- Abilities: "All Pokemon are born with a single Ability, chosen from their Basic Abilities. Normally the GM will decide what Ability a Pokemon starts with, either randomly or by choosing one." (core/05-pokemon.md, Managing Pokemon — Abilities)
- Moves: "A Pokemon may fill as many of its Move slots as it likes with Moves from its Natural Move List." (core/05-pokemon.md, Managing Pokemon — Moves)
- Move Limit: "Pokemon may learn a maximum of 6 Moves from all sources combined." (core/05-pokemon.md, Managing Pokemon — Moves)

## Expected End State
- New Pokemon record(s) exist in the database with `origin: 'wild'`, fully populated stats, moves, abilities, capabilities, skills
- The encounter's combatants JSON includes the new Pokemon as combatant(s) on the specified side
- VTT grid shows the new token(s) at valid unoccupied positions
- The Pokemon appears in the library (sheets page) with `isInLibrary: true`

## Variations
- **Single spawn**: One Pokemon added (simplest case)
- **Batch spawn**: Multiple Pokemon from encounter table generation — each processed independently through the same pipeline
- **Species not in DB**: All stats default to 5, types to Normal, empty learnset/abilities — the Pokemon is still created but with placeholder data

---

### W2: GM Manually Creates a Pokemon

---
loop_id: pokemon-lifecycle-workflow-manual-create
tier: workflow
domain: pokemon-lifecycle
gm_intent: Create a custom Pokemon with hand-entered data for an NPC, special encounter, or homebrew
ptu_refs:
  - core/05-pokemon.md#managing-pokemon-combat-stats
app_features:
  - pages/gm/create.vue
  - server/api/pokemon/index.post.ts
  - stores/library.ts
mechanics_exercised:
  - hp-formula
  - nickname-resolution
sub_workflows:
  - pokemon-lifecycle-workflow-link-unlink (W5 — to assign to a trainer afterward)
  - pokemon-lifecycle-workflow-sheet-edit (W4 — to add moves/abilities afterward)
---

## GM Context
The GM needs a specific Pokemon with custom stats — perhaps a trainer's signature Pokemon, a plot-important legendary, or a homebrew variant. The manual form gives full control but requires the GM to enter all data by hand.

## Preconditions
- GM is logged into the GM view

## Workflow Steps
1. **[Setup]** GM navigates to `/gm/create` and selects "Pokemon" creation mode
2. **[Action]** GM fills the creation form: species name (free text), nickname (optional), level (1-100), gender, shiny status, location, primary type (required), secondary type (optional), 6 base stats (default 50 each), notes
3. **[Mechanic: hp-formula]** Client calculates max HP: `level + (baseHp * 3) + 10`. Current stats are set equal to base stats (no nature adjustment applied)
4. **[Mechanic: nickname-resolution]** If no nickname provided, server auto-generates "Species N" via `resolveNickname()`
5. **[Action]** GM clicks "Create Pokemon" — store calls `POST /api/pokemon` with the form data
6. **[Bookkeeping]** Server creates Pokemon record. Origin defaults to `'manual'` (not explicitly set by the form). Nature defaults to Hardy. Moves, abilities, capabilities, and skills are empty/default
7. **[Done]** GM is redirected to `/gm/sheets` where the new Pokemon appears in the library

## PTU Rules Applied
- HP Formula: "Pokemon Hit Points = Pokemon Level + (HP x 3) + 10" (core/05-pokemon.md, Managing Pokemon — Combat Stats)

## Expected End State
- New Pokemon record in DB with `origin: 'manual'`, `isInLibrary: true`
- Base stats match what the GM entered; current stats equal base stats
- Max HP follows the PTU formula
- Moves, abilities, capabilities, skills are empty — the GM must add these separately via the Pokemon sheet
- Pokemon appears on the sheets page and can be viewed at `/gm/pokemon/:id`

## Variations
- **With nickname**: Nickname preserved as-is (trimmed)
- **Without nickname**: Auto-generated sequential name
- **[GAP: UX_GAP]** No species autocomplete — the `/api/species` search endpoint exists but is not wired into the create form. GM must know and type the species name, types, and base stats manually
- **[GAP: UX_GAP]** No auto-population from SpeciesData — even if the species name matches a seeded species, the form does not look up or fill in types, base stats, moves, abilities, or capabilities

---

### W3: Player Captures a Wild Pokemon in Combat

---
loop_id: pokemon-lifecycle-workflow-capture
tier: workflow
domain: pokemon-lifecycle
gm_intent: Transfer ownership of a wild Pokemon to a player's trainer after a successful capture
ptu_refs:
  - core/05-pokemon.md#capture-rate
  - core/05-pokemon.md#basic-pokemon-rules-and-introduction
app_features:
  - composables/useCapture.ts
  - server/api/capture/attempt.post.ts
  - server/api/capture/rate.post.ts
  - utils/captureRate.ts
mechanics_exercised:
  - capture-rate-formula
  - accuracy-check
  - ownership-transfer
  - origin-change
sub_workflows: []
---

## GM Context
During a combat encounter, a player has weakened a wild Pokemon and wants to capture it. This workflow covers the pokemon-lifecycle aspects: the ownership transfer and origin change that happen when capture succeeds. The capture rate calculation itself is cross-domain (capture domain).

## Preconditions
- An active encounter is running with a wild Pokemon combatant
- The wild Pokemon has `ownerId: null` and `origin: 'wild'`
- A player's trainer (HumanCharacter) exists to become the new owner
- The wild Pokemon has HP > 0 (cannot capture at 0 HP or below per PTU rules)

## Workflow Steps
1. **[Setup]** Wild Pokemon is already in the encounter (created via W1 wild spawn workflow)
2. **[Action]** Player declares a capture attempt on their turn
3. **[Mechanic: accuracy-check]** GM (or player) rolls d20 for the Poke Ball throw — AC 6 status attack, range = 4 + Athletics Rank. Natural 20 gives -10 to capture roll
4. **[Mechanic: capture-rate-formula]** Server calculates capture rate: base 100, modified by level (−level×2), HP% threshold (−30 to +30), evolution stage (+10/0/−10), status conditions (+5 to +10 each), injuries (+5), shiny (−10), legendary (−30)
5. **[Action]** Capture roll: d100 − trainer level − equipment/feature modifiers. If roll ≤ capture rate, capture succeeds. Natural 100 always captures
6. **[Mechanic: ownership-transfer]** On success, server updates the Pokemon: `ownerId = trainerId`
7. **[Mechanic: origin-change]** Server sets `origin = 'captured'`
8. **[Bookkeeping]** The Pokemon's HP, stats, moves, and abilities are unchanged — it retains its combat state
9. **[Done]** Pokemon is now owned by the trainer. The encounter may continue (the captured Pokemon should be removed from combatants separately)

## PTU Rules Applied
- Capture Rate Base: "First, begin with 100. Then subtract the Pokemon's Level x2." (core/05-pokemon.md, Capture Rate)
- HP Modifiers: "Above 75% HP: subtract 30... At exactly 1 HP: add +30" (core/05-pokemon.md, Capture Rate)
- Evolution Stage: "Two evolutions remaining: add +10... No evolutions remaining: subtract 10" (core/05-pokemon.md, Capture Rate)
- Poke Ball Throw: "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll, with a range equal to 4 plus your Athletics Rank." (core/05-pokemon.md, Capture Rate)
- Party Limit: "Trainers are allowed to carry with them a maximum of six Pokemon at a time while traveling." (core/05-pokemon.md, Basic Pokemon Rules)
- Loyalty: "Most caught wild Pokemon will begin at [Loyalty] Rank 2" (core/05-pokemon.md, Loyalty)

## Expected End State
- Pokemon DB record has `ownerId` set to the trainer's ID
- Pokemon `origin` field is `'captured'`
- Pokemon retains all stats, moves, abilities, injuries, status conditions from combat
- The trainer's Pokemon list (via `getPokemonByOwner()`) now includes this Pokemon
- **[GAP: UX_GAP]** No automatic removal from encounter combatants — must be done separately
- **[GAP: FEATURE_GAP]** No party limit enforcement — the app does not check whether the trainer already has 6 Pokemon
- **[GAP: FEATURE_GAP]** No loyalty tracking — captured Pokemon loyalty is not set or tracked

## Variations
- **Capture fails**: No ownership change. Player can try again on a subsequent turn with a different ball or after weakening further
- **Natural 100 roll**: Always captures regardless of calculated rate
- **Natural 20 accuracy**: −10 bonus on capture roll (easier capture)

---

### W4: GM Views and Edits a Pokemon Sheet

---
loop_id: pokemon-lifecycle-workflow-sheet-edit
tier: workflow
domain: pokemon-lifecycle
gm_intent: Review a Pokemon's full stat block and update editable fields (level, HP, nickname, notes, held item)
ptu_refs:
  - core/05-pokemon.md#managing-pokemon-combat-stats
  - core/05-pokemon.md#managing-pokemon-moves
  - core/05-pokemon.md#managing-pokemon-abilities
  - core/05-pokemon.md#managing-pokemon-capabilities
app_features:
  - pages/gm/pokemon/[id].vue
  - server/api/pokemon/[id].put.ts
  - stores/library.ts
  - composables/useEntityStats.ts
mechanics_exercised:
  - stat-display
  - move-display-with-rolls
  - partial-update
sub_workflows: []
---

## GM Context
During or between sessions, the GM needs to review a Pokemon's data — checking its moves before combat, updating HP after damage outside of encounters, changing a nickname, noting level-ups, or adjusting held items. The Pokemon sheet is the central hub for viewing and editing a single Pokemon.

## Preconditions
- A Pokemon exists in the database
- GM navigates to `/gm/pokemon/:id`

## Workflow Steps
1. **[Setup]** Page loads the Pokemon via `GET /api/pokemon/:id`. Sprite resolved via `usePokemonSprite()`
2. **[Action]** GM views 7 tabs: Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes
3. **[Action]** Stats tab shows base stats vs current stats for all 6 stats, current/max HP, stage modifiers (-6 to +6), nature, status conditions (badges), injury count
4. **[Action]** Moves tab lists all moves with type badge, damage class, frequency, AC, damage base, range, effect. Roll buttons for attack (AC check), damage, and critical damage
5. **[Action]** Abilities tab lists all abilities with name, trigger, effect
6. **[Action]** Capabilities tab shows movement values (Overland, Swim, Sky, Burrow, Levitate), Jump (High/Long), Power, Weight Class, Size, and other capabilities as tags
7. **[Action]** Skills tab lists skills with dice values (clickable to roll), plus Tutor Points, Training EXP, and Egg Groups
8. **[Action]** GM clicks "Edit" to enter edit mode. Editable fields in header: species, nickname, level, EXP, gender, shiny, location. Editable in Stats tab: currentHp, maxHp. Editable in Notes tab: notes, held item
9. **[Mechanic: partial-update]** GM clicks "Save Changes" — store calls `PUT /api/pokemon/:id` with only the changed fields
10. **[Done]** Pokemon sheet refreshes with updated data

## PTU Rules Applied
- Stat Display: Base stats + calculated stats shown side-by-side (core/05-pokemon.md, Managing Pokemon — Combat Stats)
- Move Limit: "Pokemon may learn a maximum of 6 Moves from all sources combined" (core/05-pokemon.md, Managing Pokemon — Moves) — displayed but not enforced on edit

## Expected End State
- Changed fields are persisted in the database
- Sheet view reflects the updated values
- Unchanged fields remain untouched (partial update)

## Variations
- **View-only**: GM reviews data without editing (no save needed)
- **Level change**: GM edits the level field, but no automatic stat recalculation, move learning, or ability progression occurs
- **[GAP: UX_GAP]** Types, base stats, current stats (non-HP), moves, abilities, capabilities, and skills are display-only — they cannot be edited from the sheet page
- **[GAP: UX_GAP]** No level-up flow — changing the level does not trigger stat point allocation, move learning checks, or ability progression
- **[GAP: UX_GAP]** The PUT endpoint does not handle `capabilities` or `skills` fields in the update mapping — these fields cannot be updated through the API

---

### W5: GM Links or Unlinks Pokemon to a Trainer

---
loop_id: pokemon-lifecycle-workflow-link-unlink
tier: workflow
domain: pokemon-lifecycle
gm_intent: Assign a Pokemon to a trainer's party or release it from ownership
ptu_refs:
  - core/05-pokemon.md#basic-pokemon-rules-and-introduction
  - core/05-pokemon.md#training-pokemon
app_features:
  - server/api/pokemon/[id]/link.post.ts
  - server/api/pokemon/[id]/unlink.post.ts
  - stores/library.ts
mechanics_exercised:
  - trainer-pokemon-relationship
  - ownership-transfer
sub_workflows: []
---

## GM Context
The GM needs to assign a Pokemon to a trainer (after manual creation, NPC setup, or narrative events like trading/gifting) or release a Pokemon from a trainer's ownership. This is a bookkeeping action that often follows other workflows.

## Preconditions
- A Pokemon exists in the database
- For linking: a HumanCharacter (trainer) exists to become the owner
- For unlinking: the Pokemon currently has an `ownerId`

## Workflow Steps — Link
1. **[Action]** GM triggers link action (from library UI or Pokemon sheet)
2. **[Action]** GM selects target trainer
3. **[Mechanic: trainer-pokemon-relationship]** Server calls `POST /api/pokemon/:id/link` with `{ trainerId }`. Validates trainer exists (404 if not). Sets Pokemon's `ownerId = trainerId`
4. **[Done]** Pokemon now appears in the trainer's Pokemon list. Library store updated

## Workflow Steps — Unlink
1. **[Action]** GM triggers unlink action
2. **[Mechanic: ownership-transfer]** Server calls `POST /api/pokemon/:id/unlink`. Sets Pokemon's `ownerId = null`
3. **[Done]** Pokemon is now unowned. No longer appears under any trainer's Pokemon list

## PTU Rules Applied
- Party Limit: "Trainers are allowed to carry with them a maximum of six Pokemon at a time while traveling." (core/05-pokemon.md, Basic Pokemon Rules) — **not enforced by the app**
- Ownership: "All of a Trainer's Pokemon are registered to a Trainer ID" (core/05-pokemon.md, Basic Pokemon Rules)

## Expected End State
- **Link**: Pokemon.ownerId = trainerId. `getPokemonByOwner(trainerId)` includes the Pokemon
- **Unlink**: Pokemon.ownerId = null. Pokemon appears as unowned in the library
- **[GAP: FEATURE_GAP]** No party limit enforcement — a trainer can have unlimited Pokemon linked
- **[GAP: FEATURE_GAP]** No loyalty mechanics — linking does not set or track loyalty rank

## Variations
- **Post-capture link**: After capture, Pokemon already has ownerId set — this workflow is for cases where the Pokemon was created without an owner
- **Trade**: Unlink from trainer A, then link to trainer B (two sequential API calls)

---

### W6: GM Manages Pokemon Library (Archive, Delete, Bulk Actions)

---
loop_id: pokemon-lifecycle-workflow-library-management
tier: workflow
domain: pokemon-lifecycle
gm_intent: Clean up the Pokemon library by archiving or deleting Pokemon that are no longer needed
ptu_refs: []
app_features:
  - server/api/pokemon/bulk-action.post.ts
  - server/api/pokemon/[id].delete.ts
  - stores/library.ts
mechanics_exercised:
  - archive-flag
  - bulk-action-safety-check
  - encounter-guard
sub_workflows: []
---

## GM Context
After a session or between sessions, the GM wants to clean up the library. Wild Pokemon that weren't captured, old NPCs, or test Pokemon need to be archived (hidden but preserved) or permanently deleted. Bulk operations make this efficient.

## Preconditions
- Pokemon exist in the database
- GM is viewing the library at `/gm/sheets`

## Workflow Steps — Single Delete
1. **[Action]** GM selects a Pokemon and triggers delete
2. **[Action]** Server calls `DELETE /api/pokemon/:id`. Pokemon is permanently removed
3. **[Done]** Pokemon no longer exists in the database or library

## Workflow Steps — Bulk Action
1. **[Action]** GM triggers a bulk action with either explicit Pokemon IDs or a filter (by origin, by ownership status)
2. **[Mechanic: encounter-guard]** Server fetches all active encounters, parses combatant lists, builds a set of entity IDs currently in combat
3. **[Mechanic: bulk-action-safety-check]** If ANY Pokemon in the batch is in an active encounter, the ENTIRE batch is rejected with 409 Conflict. This is all-or-nothing — no partial processing
4. **[Action]** If safe:
   - **Archive**: `updateMany` sets `isInLibrary = false` — Pokemon hidden from sheets but preserved in DB
   - **Delete**: `deleteMany` permanently removes all matching Pokemon
5. **[Done]** Library view refreshes. Archived Pokemon no longer visible; deleted Pokemon gone permanently

## PTU Rules Applied
- None — library management is an app-level feature, not a PTU mechanic

## Expected End State
- **Archive**: Pokemon records exist with `isInLibrary = false`. Not shown in library. Can be un-archived by setting `isInLibrary = true` via update
- **Delete**: Pokemon records removed from DB. Any encounter JSON references become dangling (no cascade cleanup)
- No Pokemon in active encounters was affected (safety check enforced)

## Variations
- **Filter by origin**: Archive all `origin: 'wild'` Pokemon without owners (common post-session cleanup)
- **Empty batch**: If no Pokemon match the filter/IDs, operation succeeds with `count: 0`
- **Single delete does NOT check active encounters** — only bulk-action has the encounter guard. This is an inconsistency

---

### W7: GM Imports Pokemon from External PTU Character Sheets

---
loop_id: pokemon-lifecycle-workflow-csv-import
tier: workflow
domain: pokemon-lifecycle
gm_intent: Import a player's existing Pokemon from a standard PTU Google Sheets export
ptu_refs:
  - core/05-pokemon.md#managing-pokemon-combat-stats
  - core/05-pokemon.md#managing-pokemon-moves
  - core/05-pokemon.md#managing-pokemon-abilities
app_features:
  - server/services/csv-import.service.ts
  - server/services/pokemon-generator.service.ts (createPokemonRecord)
  - server/utils/pokemon-nickname.ts
mechanics_exercised:
  - csv-stat-parsing
  - csv-move-parsing
  - nature-preservation
  - nickname-resolution
  - hp-formula
sub_workflows: []
---

## GM Context
A player joins the game with an existing character from another campaign, or the GM wants to import pre-built Pokemon from the standard PTU Google Sheets template. The CSV import preserves the player's exact stat allocations, moves, and abilities rather than auto-generating them.

## Preconditions
- A CSV file exported from the standard PTU Pokemon Google Sheet template
- The CSV follows the expected cell-position layout (species at row 0 col 9, level at row 1 col 1, etc.)

## Workflow Steps
1. **[Setup]** GM navigates to the import function
2. **[Action]** GM uploads the CSV file
3. **[Mechanic: csv-stat-parsing]** Parser reads fixed cell positions: nickname (0,1), species (0,9), level (1,1), gender (1,9), shiny (2,9), nature (2,1), base stats (rows 5-10 col 1), calculated stats (rows 5-10 col 6), max HP (5,9), types (row 32 cols 0-1)
4. **[Mechanic: csv-move-parsing]** Parser reads moves from rows 19-29: name, type, category, damage base, frequency, AC, range, effect
5. **[Action]** Parser reads abilities (rows 41-48), capabilities (rows 31-33 cols 12-17), skills (rows 58-62), held item (11,2)
6. **[Mechanic: nature-preservation]** Nature from CSV is preserved exactly (name + raised/lowered stat), unlike the generator which defaults to Hardy
7. **[Mechanic: hp-formula]** If max HP is not in the CSV, falls back to PTU formula: `level + (hp * 3) + 10`
8. **[Mechanic: nickname-resolution]** Nickname from CSV passed through `resolveNickname()`. If blank, auto-generates "Species N"
9. **[Bookkeeping]** `createPokemonRecord()` creates the Pokemon with `origin: 'import'`, `originLabel: 'Imported from PTU sheet'`
10. **[Done]** Pokemon appears in the library with exact stats/moves/abilities from the player's sheet

## PTU Rules Applied
- HP Formula fallback: "Pokemon Hit Points = Pokemon Level + (HP x 3) + 10" (core/05-pokemon.md, Managing Pokemon — Combat Stats)
- The import preserves the player's stat allocation, which should already follow the Base Relations Rule

## Expected End State
- Pokemon record in DB with all fields populated from the CSV
- `origin: 'import'` distinguishes imported Pokemon from manually created or wild-spawned ones
- Stats, moves, abilities, nature match the source PTU sheet exactly
- Types prefer SpeciesData lookup (if species exists in DB), falling back to CSV values

## Variations
- **Missing fields in CSV**: Parser uses defaults (e.g., HP formula, empty abilities)
- **Species not in SpeciesData**: Types fall back to CSV values
- **Trainer sheet**: The CSV import also handles trainer sheets — detected by sheet type, processed by a different parser path

---

## Tier 2: Mechanic Validations

---

### M1: HP Calculation Formula

---
loop_id: pokemon-lifecycle-mechanic-hp-formula
tier: mechanic
domain: pokemon-lifecycle
ptu_refs:
  - core/05-pokemon.md#managing-pokemon-combat-stats
app_features:
  - server/services/pokemon-generator.service.ts
  - server/api/pokemon/index.post.ts
  - pages/gm/create.vue
sub_loops:
  - pokemon-lifecycle-mechanic-hp-formula-edge-level1
  - pokemon-lifecycle-mechanic-hp-formula-edge-highbase
---

## Preconditions
- A Pokemon with known level and HP base stat

## Steps
1. Pokemon is created with a given level and base HP stat
2. System calculates max HP using the PTU formula

## PTU Rules Applied
- "Pokemon Hit Points = Pokemon Level + (HP x 3) + 10" (core/05-pokemon.md, Managing Pokemon — Combat Stats)
- "Note that this formula is different than a Trainer's!" (Trainer HP = `(level * 2) + (HP * 3) + 10`)

## Expected Outcomes
- Max HP = `level + (baseHp * 3) + 10`
- Examples:
  - Level 5, baseHp 4 (Charmander): 5 + 12 + 10 = **27**
  - Level 1, baseHp 5: 1 + 15 + 10 = **26**
  - Level 50, baseHp 10: 50 + 30 + 10 = **90**
  - Level 100, baseHp 25: 100 + 75 + 10 = **185**

## Edge Cases
- **Level 1, baseHp 1 (minimum)**: 1 + 3 + 10 = **14** (minimum possible HP for a level 1 Pokemon)
- **Level 100, baseHp 50 (high base)**: 100 + 150 + 10 = **260** (very high HP)
- **HP formula applied in 3 locations**: generator service, POST endpoint, and create.vue client-side — all three must produce identical results

---

### M2: Stat Point Distribution (Generator Service)

---
loop_id: pokemon-lifecycle-mechanic-stat-distribution
tier: mechanic
domain: pokemon-lifecycle
ptu_refs:
  - core/05-pokemon.md#managing-pokemon-combat-stats
app_features:
  - server/services/pokemon-generator.service.ts
sub_loops:
  - pokemon-lifecycle-mechanic-stat-distribution-edge-level1
  - pokemon-lifecycle-mechanic-stat-distribution-edge-equalbase
---

## Preconditions
- A species with known base stats
- A target level

## Steps
1. Generator service receives species base stats and target level
2. `distributeStatPoints()` allocates `level - 1` points
3. Each point is randomly assigned, weighted by base stat proportions

## PTU Rules Applied
- "Next, add +X Stat Points, where X is the Pokemon's Level plus 10." (core/05-pokemon.md, Managing Pokemon — Combat Stats) — the app distributes `level - 1` points on top of base stats because the "Level + 10" formula accounts for the base stat values already included
- "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points." (core/05-pokemon.md, Managing Pokemon — Combat Stats)

## Expected Outcomes
- Total distributed points = `level - 1`
- Points are distributed proportionally to base stats (higher base stats get more points on average)
- All final stats = `baseStat + distributedPoints` for each stat

## Edge Cases
- **Level 1**: 0 points distributed — calculated stats equal base stats exactly
- **Equal base stats (e.g., all 5s)**: Points distributed uniformly across stats
- **[GAP: PTU_DEVIATION]** The app's random weighted distribution does NOT enforce the Base Relations Rule — the resulting stat ordering may violate it. PTU says "This order must be maintained when adding Stat Points" but the generator doesn't check ordering. This is acceptable for wild/NPC Pokemon where the GM doesn't manually allocate stats
- **Species not found**: All base stats default to 5

---

### M3: Move Selection from Learnset

---
loop_id: pokemon-lifecycle-mechanic-move-selection
tier: mechanic
domain: pokemon-lifecycle
ptu_refs:
  - core/05-pokemon.md#managing-pokemon-moves
app_features:
  - server/services/pokemon-generator.service.ts
sub_loops: []
---

## Preconditions
- A species with a learnset (array of `{ level, move }` entries) seeded in SpeciesData
- A target level
- MoveData table populated with move definitions

## Steps
1. Filter species learnset to entries where `entry.level <= pokemonLevel`
2. Take the last 6 entries (most recently learned moves)
3. Look up each move name in the MoveData table for full definitions (type, damage class, frequency, AC, damage base, range, effect)

## PTU Rules Applied
- "Pokemon may learn a maximum of 6 Moves from all sources combined." (core/05-pokemon.md, Managing Pokemon — Moves)
- "A Pokemon may fill as many of its Move slots as it likes with Moves from its Natural Move List. This includes all Moves gained from Level Up" (core/05-pokemon.md, Managing Pokemon — Moves)

## Expected Outcomes
- Pokemon has at most 6 moves
- All moves are from the species' level-up learnset at or below the Pokemon's level
- Moves are the most recently learned (highest level entries that are still at or below current level)

## Edge Cases
- **Level 1, no level-1 moves in learnset**: Pokemon has 0 moves (empty array)
- **Species with fewer than 6 moves at target level**: Pokemon has fewer than 6 moves
- **Move not found in MoveData**: Falls back to stub — `type: 'Normal'`, `damageClass: 'Status'`, `frequency: 'At-Will'`, `range: 'Melee'`, no damage base
- **Override moves provided (template load)**: Learnset selection is skipped entirely — overrides are used as-is

---

### M4: Ability Assignment

---
loop_id: pokemon-lifecycle-mechanic-ability-assignment
tier: mechanic
domain: pokemon-lifecycle
ptu_refs:
  - core/05-pokemon.md#managing-pokemon-abilities
app_features:
  - server/services/pokemon-generator.service.ts
sub_loops: []
---

## Preconditions
- A species with abilities seeded in SpeciesData (array of ability names)

## Steps
1. Generator reads species ability list
2. Takes the first 2 abilities from the list (basic abilities)
3. Randomly selects one

## PTU Rules Applied
- "All Pokemon are born with a single Ability, chosen from their Basic Abilities. Normally the GM will decide what Ability a Pokemon starts with, either randomly or by choosing one." (core/05-pokemon.md, Managing Pokemon — Abilities)
- "At Level 20, a Pokemon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities." (core/05-pokemon.md, Managing Pokemon — Abilities)
- "At Level 40, a Pokemon gains a Third Ability, which may be chosen from any of its Abilities." (core/05-pokemon.md, Managing Pokemon — Abilities)

## Expected Outcomes
- Pokemon has exactly 1 ability, from the species' basic ability list
- Ability stored as `[{ name, effect: '' }]` — effect text is empty (not looked up from AbilityData)

## Edge Cases
- **Empty ability list**: Pokemon has 0 abilities (empty array)
- **Species with only 1 basic ability**: That ability is always selected
- **Override abilities (template load)**: Random selection is skipped — overrides used as-is
- **[GAP: FEATURE_GAP]** Level 20+ Pokemon from wild spawn still only get 1 ability — the app does not implement the L20 (2nd ability) or L40 (3rd ability) progression. PTU rules say "At Level 20, a Pokemon gains a Second Ability"
- **[GAP: FEATURE_GAP]** Ability effect text is always empty — not looked up from AbilityData. The AbilityData table is not seeded by `seed.ts`

---

### M5: Nickname Resolution

---
loop_id: pokemon-lifecycle-mechanic-nickname-resolution
tier: mechanic
domain: pokemon-lifecycle
ptu_refs: []
app_features:
  - server/utils/pokemon-nickname.ts
sub_loops: []
---

## Preconditions
- A species name
- An optional nickname string

## Steps
1. If nickname is provided and non-empty after trimming: return the trimmed nickname
2. If no nickname: count all existing Pokemon of the same species in the DB, return `"Species (count+1)"`

## PTU Rules Applied
- None — nickname resolution is an app-level convenience feature

## Expected Outcomes
- `resolveNickname("Pikachu", "Sparky")` → `"Sparky"`
- `resolveNickname("Pikachu", null)` with 0 existing Pikachu → `"Pikachu 1"`
- `resolveNickname("Pikachu", null)` with 2 existing Pikachu → `"Pikachu 3"`
- `resolveNickname("Pikachu", "  Buddy  ")` → `"Buddy"` (trimmed)

## Edge Cases
- **Empty string nickname** (`""`): treated as no nickname, auto-generates
- **Whitespace-only nickname** (`"   "`): treated as no nickname after trim
- **Deletion gap**: If "Pikachu 2" is deleted and only 1 Pikachu remains, the next auto-name is "Pikachu 2" (reuses the number). No collision since the old one is deleted
- **All creation paths use this**: wild spawn, manual create (POST endpoint), CSV import, template load — all go through `resolveNickname()`

---

### M6: Nature Application to Base Stats

---
loop_id: pokemon-lifecycle-mechanic-nature-application
tier: mechanic
domain: pokemon-lifecycle
ptu_refs:
  - core/05-pokemon.md#pokemon-nature-chart
app_features:
  - server/services/pokemon-generator.service.ts
  - server/api/pokemon/index.post.ts
  - pages/gm/create.vue
sub_loops: []
---

## Preconditions
- A Pokemon with base stats and a nature

## Steps
1. Identify the nature's raised and lowered stats
2. Apply modifiers: HP raised/lowered by 1, all other stats raised/lowered by 2
3. Minimum stat value after nature is 1

## PTU Rules Applied
- "Next, apply your Pokemon's Nature. This will simply raise one stat, and lower another; HP is only ever raised or lowered by 1, but all other stats are raised or lowered by 2, respectively, to a minimum of 1." (core/05-pokemon.md, Managing Pokemon — Combat Stats)
- Neutral natures (Hardy, Docile, etc.) have the same stat for raise and lower, canceling out

## Expected Outcomes
- Adamant nature: Attack +2, Special Attack -2
- Cuddly nature: HP +1, Attack -2
- Hardy nature (neutral): no change

## Edge Cases
- **Neutral natures**: 6 natures are neutral (Composed, Hardy, Docile, Bashful, Quirky, Serious) — they cancel out
- **HP adjustments**: Only ±1 for HP, not ±2 like other stats
- **Minimum stat 1**: If a base stat is 1 and nature lowers it, it stays at 1
- **[GAP: FEATURE_GAP]** The generator service defaults ALL Pokemon to Hardy (neutral) — nature is never randomly rolled or meaningfully assigned during auto-generation. Wild Pokemon always have Hardy nature
- **[GAP: UX_GAP]** The manual create form does not have a nature selector — nature defaults to Hardy
- **CSV import preserves nature**: Only path where non-Hardy natures enter the system

---

## Tier 1 Mechanic Coverage Verification

| Tier 2 Mechanic | Exercised By Workflow(s) |
|-----------------|--------------------------|
| M1: HP Formula | W1 (wild spawn), W2 (manual create), W7 (CSV import) |
| M2: Stat Distribution | W1 (wild spawn) |
| M3: Move Selection | W1 (wild spawn) |
| M4: Ability Assignment | W1 (wild spawn) |
| M5: Nickname Resolution | W1 (wild spawn), W2 (manual create), W7 (CSV import) |
| M6: Nature Application | W7 (CSV import — only path with non-Hardy natures) |

### Mechanics NOT Covered by Workflows (Gaps)

| Mechanic | Status | Notes |
|----------|--------|-------|
| Evolution | GAP: FEATURE_GAP | No evolution UI, API, or service exists. `SpeciesData` has `evolutionStage`/`maxEvolutionStage` (read-only, used by capture rate only). To "evolve" would require changing species + recalculating all derived data |
| Level-Up Flow | GAP: FEATURE_GAP | Level is editable on the sheet, but changing it does not trigger stat point allocation, move learning, or ability progression |
| Move Learning on Level Up | GAP: FEATURE_GAP | No automatic check of learnset when level changes |
| Ability Progression (L20/L40) | GAP: FEATURE_GAP | Wild spawn gives 1 ability regardless of level. No UI to add abilities at L20/L40 milestones |
| Tutor Points Accumulation | GAP: FEATURE_GAP | Field exists in DB (`tutorPoints`) but no logic to grant points at L5/L10/L15/etc. |
| Base Relations Rule | GAP: PTU_DEVIATION | Generator's random stat distribution does not enforce base stat ordering. Acceptable for wild/NPC Pokemon |
| Party Limit (6 Pokemon) | GAP: FEATURE_GAP | No enforcement — trainers can have unlimited linked Pokemon |
| Loyalty | GAP: FEATURE_GAP | No loyalty field or tracking. PTU: caught wild Pokemon start at Loyalty 2 |
| Nature Random Rolling | GAP: FEATURE_GAP | All auto-generated Pokemon get Hardy (neutral). PTU: "roll 2d6" for random nature |
| Gender Ratio | GAP: PTU_DEVIATION | Generator uses 50/50 regardless of species. PTU: each species has a gender balance ratio |
| Breeding | GAP: FEATURE_GAP | No breeding system |
| Mega Evolution | GAP: FEATURE_GAP | No Mega Evolution support |
| Experience/Training | GAP: FEATURE_GAP | XP and training exp fields exist but no XP award or training system |

---

## Feasibility Summary

| Workflow | Step | Status | Details |
|----------|------|--------|---------|
| W1 Wild Spawn | All | FEASIBLE | Full pipeline: species lookup → stat generation → move selection → ability pick → DB create → encounter insert |
| W2 Manual Create | Species entry | GAP: UX_GAP | No species autocomplete. `/api/species` endpoint exists but is not wired to the create form |
| W2 Manual Create | Auto-populate | GAP: UX_GAP | Species name is free text — no auto-fill of types, stats, moves, abilities from SpeciesData |
| W3 Capture | Capture + link | FEASIBLE | Full pipeline: rate calculation → attempt → ownership transfer |
| W3 Capture | Remove from combat | GAP: UX_GAP | Captured Pokemon is not auto-removed from encounter combatants |
| W3 Capture | Party limit | GAP: FEATURE_GAP | No check for 6-Pokemon limit on trainer |
| W3 Capture | Loyalty | GAP: FEATURE_GAP | Captured Pokemon loyalty not tracked |
| W4 Sheet Edit | View tabs | FEASIBLE | All 7 tabs render correctly |
| W4 Sheet Edit | Edit stats | GAP: UX_GAP | Only currentHp/maxHp editable. Types, base stats, current stats, moves, abilities, capabilities, skills are display-only |
| W4 Sheet Edit | Level-up flow | GAP: FEATURE_GAP | Changing level does not trigger stat allocation, move learning, or ability checks |
| W4 Sheet Edit | capabilities/skills PUT | GAP: UX_GAP | PUT endpoint doesn't handle capabilities or skills in update mapping |
| W5 Link/Unlink | All | FEASIBLE | Both endpoints work. Trainer existence validated on link |
| W6 Library Mgmt | Archive/Delete | FEASIBLE | Bulk action with encounter safety check works |
| W6 Library Mgmt | Single delete | Inconsistency | Single delete does NOT check active encounters (unlike bulk action) |
| W7 CSV Import | All | FEASIBLE | Full pipeline: CSV parse → stat extraction → createPokemonRecord |
| N/A | Evolution | GAP: FEATURE_GAP | No evolution mechanic implemented anywhere in the app |
| N/A | Ability progression | GAP: FEATURE_GAP | No L20/L40 ability milestones |
| N/A | Tutor points | GAP: FEATURE_GAP | Field exists, no accumulation logic |
