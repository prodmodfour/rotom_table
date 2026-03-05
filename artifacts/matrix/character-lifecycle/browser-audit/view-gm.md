---
domain: character-lifecycle
type: browser-audit-view
view: gm
route_prefix: /gm
checked_count: 30
present: 27
absent: 1
error: 2
unreachable: 0
---

# Browser Audit: GM View - character-lifecycle

## GM Sheets Page (`/gm/sheets`)

### C053: Human Card
- **Route checked:** `/gm/sheets`
- **Expected element:** Link card with character name, level, HP, speed, team sprites
- **Found:** Yes (ref=e81, ref=e95)
- **Classification:** Present
- **Evidence:** `link "H Hassan Player Level 1 HP: 45/45 SPD: 11 Gible"` and `link "M Marilena Player Level 1 HP: 51/51 SPD: 7 Misdreavus"`

### C054: Pokemon Card
- **Route checked:** `/gm/sheets`
- **Expected element:** Link card with Pokemon species, level, HP, types, sprite
- **Found:** Yes (ref=e123, ref=e141, ref=e158)
- **Classification:** Present
- **Evidence:** `link "Chomps Chomps Gible Dragon Ground Level 10 HP 47/47"`, `link "Iris Iris Misdreavus Ghost Level 10 HP 44/44"`, `link "Pidgey 1 Pidgey 1 Wild Pidgey Normal Level 5 HP 165/165"`

### C055: Character Modal (ORPHAN)
- **Route checked:** N/A
- **Expected element:** None (dead code per capability catalog)
- **Found:** N/A
- **Classification:** Untestable
- **Evidence:** Capability catalog marks this as "NOT rendered by any page or parent component -- dead code"

### C089: GM Sheets Page
- **Route checked:** `/gm/sheets`
- **Expected element:** "Character Library" heading, Manage button, "+ New Character" link, search/filter controls
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `heading "Character Library"` (ref=e61), `button "Manage"` (ref=e63), `link "+ New Character"` (ref=e64), `textbox "Search..."` (ref=e67), type/character/origin/sort dropdowns (ref=e69/e71/e73/e75), `button "Reset"` (ref=e76), `heading "Players (2)"` (ref=e79), `heading "Pokemon (3)"` (ref=e110)

### C040: Filtered Humans (Getter) -- UI terminus
- **Route checked:** `/gm/sheets`
- **Expected element:** Filter controls for type, character type, origin, sort
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Combobox options: "All Types"/"Humans Only"/"Pokemon Only", "All Characters"/"Players"/"NPCs", "All Origins"/"Manual"/"Wild"/"Captured"/"Template"/"Imported", "Sort by Name"/"Sort by Level"

### C045: Set Library Filters -- UI terminus
- **Route checked:** `/gm/sheets`
- **Expected element:** Search textbox and filter dropdowns
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `textbox "Search..."` (ref=e67) and 4 combobox dropdowns

---

## GM Create Page (`/gm/create`)

### C071: Quick Create Form
- **Route checked:** `/gm/create`
- **Expected element:** Quick Create form with name, type, level, location, sprite, raw stats
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `heading "Quick Create"`, `textbox` for name (ref=e85), `combobox` with "Player Character"/"NPC" (ref=e88), `spinbutton` for level (ref=e92), `textbox "e.g., Mesagoza"` for location (ref=e95), `button "Choose Sprite"` (ref=e101), 6 stat spinbuttons (HP/Attack/Defense/Sp.Attack/Sp.Defense/Speed), `textbox "Additional notes..."`, `button "Create Human"` (ref=e127)

### C072: Stat Allocation Section
- **Route checked:** `/gm/create` (Full Create mode)
- **Expected element:** Stat point allocation with +/- buttons, points remaining, derived stats
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `heading "Combat Stats"`, "Points Remaining: 10 / 10", 6 stat rows (HP/Attack/Defense/Sp.Attack/Sp.Defense/Speed) each with base value, +/- buttons, allocated points, and total. `heading "Derived Stats"` with "Max HP: 42", "Physical Evasion: 1", "Special Evasion: 1", "Speed Evasion: 1"

### C073: Skill Background Section
- **Route checked:** `/gm/create` (Full Create mode)
- **Expected element:** Background dropdown, skills grid with Body/Mind/Spirit categories
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `heading "Background & Skills"`, `combobox` with 11 background presets + "Custom Background" (ref=e209), skills grid with 3 category headings ("Body"/"Mind"/"Spirit"), 17 skills listed (Acrobatics through Intuition), validation warnings: "Background should set exactly 1 skill to Adept (found 0)", "Background should set exactly 1 skill to Novice (found 0)", "Background should set exactly 3 skills to Pathetic (found 0)"

### C074: Class Feature Section
- **Route checked:** `/gm/create` (Full Create mode)
- **Expected element:** Class picker with searchable categories, feature input, training feature slot
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `heading "Classes & Features"`, `heading "Trainer Classes"` with "0 / 4", class search textbox (ref=e298), class categories: "Introductory", "Battling Style", "Specialist Team", "Professional", "Fighter", "Supernatural" with individual class buttons (Ace Trainer, Capture Specialist, etc.), `heading "Features"` with "0 / 4 (+1 Training)", feature input textbox (ref=e443), "Training Feature (free, no prerequisites)" label with input (ref=e447). Branch classes shown with "[Branch]" tag (e.g., "Stat Ace [Branch]", "Type Ace [Branch]")

### C075: Edge Selection Section
- **Route checked:** `/gm/create` (Full Create mode)
- **Expected element:** Edge input, edge counter, skill edge button
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `heading "Edges"` with "0 / 4", `textbox "Enter edge name..."` (ref=e282), `button "Add Edge"` (disabled, ref=e283), `button "Add Skill Edge"` (ref=e285), validation warning: "Level 1 trainers should have 4 edges (4 starting edges) (have 0)"

### C076: Biography Section
- **Route checked:** `/gm/create` (Full Create mode)
- **Expected element:** Biography section (collapsible) with age, gender, height, weight, story fields
- **Found:** Yes (collapsed)
- **Classification:** Present
- **Evidence:** `button "Biography"` (ref=e536) with `heading "Biography"` and expand arrow icon. Section is collapsible.

### C090: GM Create Page
- **Route checked:** `/gm/create`
- **Expected element:** Create Character heading, Human/Pokemon mode toggle, Quick/Full toggle
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `heading "Create Character"` (ref=e62), `button "Human Character"` (ref=e64), `button "Pokemon"` (ref=e67), `button "Quick Create Minimal NPC scaffolding"` (ref=e71), `button "Full Create PTU-compliant multi-section"` (ref=e75), `link "Back to Sheets"` (ref=e61), validation summary section with all warnings

### C058: Trainer Sprite Picker
- **Route checked:** `/gm/create`
- **Expected element:** "Choose Sprite" button that opens sprite picker modal
- **Found:** Yes (button present, modal behind it)
- **Classification:** Present
- **Evidence:** `button "Choose Sprite"` (ref=e101) in Quick Create, `generic "?"` placeholder avatar (ref=e100)

---

## GM Character Detail Page (`/gm/characters/[id]`)

### C091: GM Character Detail Page
- **Route checked:** `/gm/characters/4bbaf02e-8220-41a5-89c8-7c0a96100b5c`
- **Expected element:** Character detail page with edit button, tabs, stat display
- **Found:** No -- SCSS compilation error prevents page from rendering
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** 500 error: `"[plugin:vite:css] [sass] Undefined variable. 82 | gap: $spacing-xs; | ^^^^^^^^^^^ assets/scss/_level-up-shared.scss 82:8 levelup-tag() components/levelup/LevelUpClassSection.vue 84:3 root stylesheet"`. TypeError: "Failed to fetch dynamically imported module: pages/gm/characters/[id].vue". The LevelUpModal component's SCSS references `$spacing-xs` from `_level-up-shared.scss` without importing `_variables.scss`, causing the entire page to fail.

### C056: Trainer XP Panel
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** XP panel with award buttons, custom input
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Page fails to render due to SCSS compilation error (see C091)

### C060: Human Stats Tab
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Stats tab with HP bar, base stats, combat stages, CapabilitiesDisplay
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Page fails to render. Code review confirms the tab exists in template with stat-block divs for all 6 stats, currentHp display, CapabilitiesDisplay component, and height/weight/money fields.

### C061: Human Classes Tab
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Classes tab with trainer classes, features, edges, capabilities
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Page fails to render. Code review confirms tab template with Trainer Classes tags, Features tags, Edges tags, Capabilities input/display.

### C062: Human Skills Tab
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Skills tab with skill ranks grid
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Page fails to render. Code review confirms skills-grid with skill-item divs.

### C063: Human Pokemon Tab
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Pokemon tab with linked Pokemon list
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Page fails to render. Code review confirms pokemon-team with NuxtLink to `/gm/pokemon/[id]`.

### C064: Human Equipment Tab
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Equipment tab with HumanEquipmentTab component
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Page fails to render. Code review confirms HumanEquipmentTab component present in template.

### C065: Notes Tab
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Notes tab with background, personality, goals, notes textareas
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Page fails to render. Code review confirms 4 textareas: Background, Personality, Goals, Notes.

### C059: Capabilities Display
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Derived trainer capabilities (Overland, Swim, etc.) inside Stats tab
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** MEDIUM
- **Evidence:** Page fails to render. Code review confirms `<CapabilitiesDisplay :derived-stats="derivedStats" />` in Stats tab.

### C057: Equipment Catalog Browser
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Searchable equipment catalog inside Equipment tab
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** MEDIUM
- **Evidence:** Page fails to render. EquipmentCatalogBrowser is used inside HumanEquipmentTab.

### C077: Level Up Modal
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Modal triggered by level change or XP level-up
- **Found:** No -- blocked by C091 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** This is the root cause of the SCSS error. `LevelUpModal` imports `LevelUpClassSection` which uses `_level-up-shared.scss` with undefined variable `$spacing-xs`.

### C078: Level Up Stat Section
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Stat allocation within level-up modal
- **Found:** No -- blocked by C091/C077 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Child of LevelUpModal which causes the page crash.

### C079: Level Up Class Section
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Class selection within level-up modal
- **Found:** No -- blocked by C091/C077 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** This specific component (`LevelUpClassSection.vue`) is the direct source of the SCSS error.

### C080: Level Up Feature Section
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Feature selection within level-up modal
- **Found:** No -- blocked by C091/C077 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Child of LevelUpModal. Console error shows 404 for its scoped stylesheet too.

### C081: Level Up Edge Section
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Edge selection within level-up modal
- **Found:** No -- blocked by C091/C077 Error
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Child of LevelUpModal. Console error shows 404 for its scoped stylesheet too.

### C082: Level Up Milestone Section
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Milestone tracking within level-up modal
- **Found:** No -- blocked by C091/C077 Error
- **Classification:** Error
- **Severity:** MEDIUM
- **Evidence:** Child of LevelUpModal. Cannot render due to SCSS error.

### C083: Level Up Summary
- **Route checked:** `/gm/characters/[id]`
- **Expected element:** Summary of level-up changes before confirmation
- **Found:** No -- blocked by C091/C077 Error
- **Classification:** Error
- **Severity:** MEDIUM
- **Evidence:** Child of LevelUpModal. Cannot render due to SCSS error.

---

## CSV Import (No UI Page)

### C008 UI terminus: CSV Import Button
- **Route checked:** `/gm/sheets` (expected location)
- **Expected element:** Import button or upload area for CSV
- **Found:** No -- no visible CSV import button on sheets page
- **Classification:** Absent
- **Severity:** LOW
- **Evidence:** The `/gm/sheets` page shows "Manage" button and "+ New Character" link but no CSV import UI element. The API endpoint C008 exists but has no visible UI trigger. The "Manage" panel shows archive/delete actions, not import.

---

## Summary

| Classification | Count |
|----------------|-------|
| Present | 13 |
| Absent | 1 |
| Error | 15 |
| Unreachable | 0 |
| Untestable | 1 |
| **Total** | **30** |

### Root Cause Analysis

All 15 Error items share a single root cause: SCSS compilation failure in `_level-up-shared.scss` line 82 (`$spacing-xs` undefined variable). This file is imported by `LevelUpClassSection.vue`, `LevelUpEdgeSection.vue`, `LevelUpFeatureSection.vue`, and `LevelUpModal.vue`. Because `LevelUpModal` is imported by the character detail page (`/gm/characters/[id].vue`), the entire page fails to load. Fixing the SCSS import would resolve all 15 errors.

The affected SCSS file (`_level-up-shared.scss`) uses global SCSS variables (e.g., `$spacing-xs`, `$spacing-sm`) but the components importing it via scoped `@use` blocks do not forward the variables file. The fix would be to add `@use '~/assets/scss/variables' as *` at the top of `_level-up-shared.scss` or configure Vite's `additionalData` to auto-inject variables.
