# Habitat Detail Page

Accessed at `/gm/habitats/:id` by clicking a card on the [[habitats-list-page]]. The page title reflects the table name (e.g. "GM - Bramblewick - General").

A "← Back to Habitats" link returns to the [[habitats-list-page]]. The table name appears as an h2 heading with three action buttons:

- **Settings** — opens the [[habitat-settings-modal]]
- **Generate** — opens the [[generate-wild-encounter-modal]]
- **Delete** — opens the [[habitat-delete-confirmation-modal]]

Below the header is a metadata section showing Description, Level Range, [[population-density-label]], and Total Weight (the sum of all entry weights).

The page body has two sections: [[habitat-pokemon-entries-table]] (with the [[habitat-add-pokemon-modal]] for adding species) and [[habitat-sub-habitats]].

## See also

- [[encounter-table-data-model-has-four-prisma-entities]] — the Prisma models backing this page
- [[table-editor-component-shared-across-both-ui-surfaces]] — the shared component rendering this page's editing UI
- [[encounter-tables-have-two-parallel-ui-surfaces]] — this page is one of two UI surfaces for the same data
