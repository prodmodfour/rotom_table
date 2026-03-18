# Encounter Save Template Modal

Clicking "Save Template" in the [[encounter-toolbar]] during an active encounter opens a modal titled "Save as Template." This saves the current encounter state as a reusable template in the [[encounter-library-page]].

The modal contains four editable fields:

- **Template Name** (required) — text input
- **Description** (optional) — multi-line textarea (3 rows)
- **Category** (optional) — text input with datalist autocomplete populated from existing categories in the library
- **Tags** (optional) — comma-separated text input; parsed into lowercase trimmed tokens and previewed as teal tag chips below the input

Below the form, a read-only "Template Summary" section shows:

- **Battle Type** — the encounter's battle type
- **Combatants** — count from the active encounter
- **Grid** — "Enabled" or "No grid" based on the encounter's grid config

The "Save Template" button is disabled until the name is filled. On save, the API extracts combatant data (species, nickname, level, nature, abilities, moves for pokemon; name, characterType, level, trainerClasses for humans) and grid configuration (including isometric mode and camera angle) from the active encounter.

## See also

- [[encounter-toolbar]] — where the Save Template button lives
- [[encounter-template-stores-combatant-snapshots]]
- [[encounter-template-from-encounter-strips-runtime-state]] — how the API extracts the snapshot from the live encounter
