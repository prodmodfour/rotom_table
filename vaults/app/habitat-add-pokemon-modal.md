# Habitat Add Pokemon Modal

Clicking "+ Add Pokemon" on the [[habitat-pokemon-entries-table]] opens a modal titled "Add Pokemon" with a close (×) button. The modal contains:

- **Pokemon Species** (required) — a [[species-autocomplete-loads-all-on-mount]] text input with "Search Pokemon..." placeholder
- **Rarity** — dropdown with presets: Common (Weight: 10), Uncommon (Weight: 5), Rare (Weight: 3), Very Rare (Weight: 1), Legendary (Weight: 0.1), and Custom Weight
- **Level Range Override** (optional) — Min and Max spinbuttons with a note "Leave blank to use table's default range"

The "Add" button is disabled until a species is selected. "Cancel" closes the modal without changes.

## See also

- [[use-table-editor-composable-orchestrates-editing-ui]] — manages the form state and submission logic for this modal
- [[encounter-table-entry-prevents-duplicate-species]] — adding an already-present species returns a 409 conflict
- [[encounter-table-seed-weights-differ-from-ui-rarity-presets]] — the seed data uses a different weight scale than these presets
