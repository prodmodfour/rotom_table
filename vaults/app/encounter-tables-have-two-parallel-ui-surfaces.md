Two sets of pages present the same encounter table data:

1. `/gm/encounter-tables` and `/gm/encounter-tables/:id` — the original pages, using `TableCard` for the list view. The [[encounter-tables-list-page]] is not linked from the nav bar.
2. `/gm/habitats` and `/gm/habitats/:id` — the newer pages, using `EncounterTableCard` with richer visuals (images, sprites). The [[habitats-list-page]] is linked from the [[gm-navigation-bar]].

Both share the same [[encounter-table-store-centralizes-state-and-api-calls]], [[use-table-editor-composable-orchestrates-editing-ui]], and [[encounter-table-api-is-nested-rest-hierarchy]]. Both detail pages use the [[table-editor-component-shared-across-both-ui-surfaces]].

The habitats surface adds features not present in the encounter-tables surface: a [[generate-wild-encounter-modal]] accessible from the detail page, a delete button, and sprite-rich cards.
