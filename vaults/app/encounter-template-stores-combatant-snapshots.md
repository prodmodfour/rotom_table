# Encounter Template Stores Combatant Snapshots

When a template is saved from an active encounter via the [[encounter-save-template-modal]], the API extracts a snapshot of each combatant's data rather than storing references to database records.

For Pokemon combatants, the snapshot includes: species, nickname, level, nature, abilities, moves, shiny status, and gender.

For human combatants, the snapshot includes: name, characterType, level, and trainerClasses.

Each combatant record also stores: type (pokemon or human), side (player, ally, or enemy), grid position, and token size.

Grid configuration is also snapshotted: width, height, cell size, isometric mode, and camera angle.

This means loading a template [[encounter-template-load-endpoint-generates-pokemon|recreates combatants from snapshots]] rather than reusing existing database Pokemon or characters.

## See also

- [[encounter-template-from-encounter-strips-runtime-state]] — how the API extracts these snapshots from a live encounter
- [[encounter-template-prisma-model]] — how the snapshots are persisted in the database
