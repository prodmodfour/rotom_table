# Habitat Add Modification Entry Modal

A modal titled "Add Modification Entry" opened by the "+ Add Change" button on a sub-habitat card in the [[habitat-sub-habitats]] section.

Fields:

- **Pokemon Species** (required) — a search input with "Search Pokemon..." placeholder
- **Action** — dropdown with "Override Weight" (default) and "Remove from Table"
- **New Weight** — spinbutton defaulting to 10, with a note "This Pokemon will be added to this sub-habitat"

The "Add" button is disabled until a species is selected. "Cancel" closes the modal without changes.

The resulting modification appears in the sub-habitat card's Modifications list as a row with an indicator icon (↔ for weight overrides), the species name, and the new weight value (see [[modification-card-shows-change-type-indicators]]). These modifications alter [[habitat-weight-determines-encounter-chance|entry weights]] when the sub-habitat is selected during encounter generation.

## See also

- [[modification-entry-references-species-by-name-not-id]] — why modifications reference species by name, enabling additions of species not in the parent table
