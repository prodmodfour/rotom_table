# Encounter Template From-Encounter Strips Runtime State

The `POST /api/encounter-templates/from-encounter` endpoint creates a template by reading a live encounter's combatants and stripping all runtime state (HP, conditions, combat stages, turn state).

For Pokemon combatants, it extracts: species, nickname, level, nature, abilities, moves, shiny status, and gender. For human combatants, it extracts: name, characterType, level, and trainerClasses. Each combatant also retains: type, side, grid position, and token size.

The endpoint also captures the encounter's grid configuration including isometric settings.

This is the server-side mechanism behind the [[encounter-save-template-modal]]. The resulting snapshot format is what [[encounter-template-stores-combatant-snapshots]] describes.

## See also

- [[encounter-template-load-endpoint-generates-pokemon]] — the reverse process, where snapshots are materialized back into live records
