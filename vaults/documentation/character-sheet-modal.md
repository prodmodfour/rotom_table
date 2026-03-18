# Character Sheet Modal

`components/character/CharacterModal.vue` — full-sheet modal for viewing and editing characters or Pokemon.

## Tabbed Interface

**Human tabs:** Stats, Classes, Skills, Equipment, Pokemon, Notes.

- **HumanStatsTab** — HP, base stats, evasions, injuries, AP pool, [[trainer-derived-stats|derived stats]] display
- **HumanClassesTab** — trainer classes view/edit
- **HumanSkillsTab** — skill ranks by category from [[trainer-skill-definitions]]
- **HumanEquipmentTab** — slot management via [[equipment-system]]
- **HumanPokemonTab** — linked Pokemon with link/unlink actions
- **NotesTab** — freeform notes

**Pokemon tabs:** Stats, Moves, Abilities, Capabilities, Skills, Notes.

## Level-Up Integration

A level watcher intercepts level increases and opens [[trainer-level-up-wizard|LevelUpModal]]. An `isApplyingLevelUp` guard prevents double-trigger when the wizard writes results back to `editData`.

## Access

Opened from [[character-card]] clicks in the [[library-store|library]] and from the dedicated character sheet route in [[gm-view-routes|/gm/characters/:id]].

## See also

- [[equipment-system]]
- [[trainer-level-up-wizard]]
- [[trainer-derived-stats]]
- [[pokemon-sheet-page]] — dedicated full-page Pokemon sheet alternative
