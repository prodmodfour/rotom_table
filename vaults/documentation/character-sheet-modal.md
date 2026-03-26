# Character Sheet Modal

`components/character/CharacterModal.vue` — full-sheet modal for viewing and editing characters or Pokemon.

## Tabbed Interface

**Human tabs:** Stats, Traits, Skills, Equipment, Pokemon, Notes.

- **HumanStatsTab** — HP, base stats, evasions, injuries, [[trainer-derived-stats|derived stats]] display
- **HumanTraitsTab** — trait view/edit
- **HumanSkillsTab** — skills per [[ptr-skill-list]]
- **HumanEquipmentTab** — slot management via [[equipment-system]]
- **HumanPokemonTab** — linked Pokemon with link/unlink actions
- **NotesTab** — freeform notes

**Pokemon tabs:** Stats, Moves, Traits, Skills, Notes.

## Access

Opened from [[character-card]] clicks in the [[library-store|library]] and from the dedicated character sheet route in [[gm-view-routes|/gm/characters/:id]].

## See also

- [[equipment-system]]
- [[trainer-derived-stats]]
- [[pokemon-sheet-page]] — dedicated full-page Pokemon sheet alternative
