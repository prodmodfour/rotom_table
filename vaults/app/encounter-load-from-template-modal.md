# Encounter Load from Template Modal

Clicking "Load from Template" on the [[encounter-no-active-state]] panel opens a modal titled "Load from Template." This is the primary way to start an encounter from a saved template.

The modal contains:

- **Search and filter** — a search textbox and category dropdown (same options as the [[encounter-library-page]]: All Categories, Wild Battle)
- **Template list** — a scrollable list of compact template items. Each item shows the template name, description (if any), battle type badge, combatant count, and grid dimensions. Clicking an item selects it (highlighted with a teal border).
- **Combatants Preview** — appears below the list when a template is selected, showing each combatant with a color-coded side dot (green=player, blue=ally, red=enemy), name, and type.
- **Encounter Name** field (required) — auto-filled with the selected template's name on first selection. Editable so the GM can rename the encounter.

The footer has a "Browse Library" link to the [[encounter-library-page]], plus Cancel and "Create Encounter" buttons. The "Create Encounter" button is disabled until a template is selected and the encounter name is non-empty.

The search filters by template name, description, and tags.

## See also

- [[encounter-library-load-confirmation-modal]] — the simpler confirmation used when loading from the library page directly
- [[encounter-library-search-filters-templates-by-name-description-tags]]
- [[encounter-template-load-endpoint-generates-pokemon]] — what happens server-side when "Create Encounter" is clicked
