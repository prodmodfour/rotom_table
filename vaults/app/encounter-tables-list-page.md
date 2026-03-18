# Encounter Tables List Page

Accessed at `/gm/encounter-tables`. This route is not linked from the [[gm-navigation-bar]] — the nav bar links to the [[habitats-list-page]] instead.

The page heading is "Encounter Tables" with "Import" and "+ New Table" buttons. Below the heading are [[encounter-tables-search-sort-controls]].

Tables appear as [[encounter-table-card]]s in a three-column grid. Clicking a card navigates to `/gm/encounter-tables/:id`, which [[encounter-table-id-route-highlights-card|highlights the card without opening a separate detail view]].

The "Import" button opens the [[encounter-table-import-modal]] and the "+ New Table" button opens the [[encounter-table-create-modal]].

## See also

- [[habitats-list-page]] — an alternative sprite-based view of the same data at `/gm/habitats`
- [[encounter-tables-have-two-parallel-ui-surfaces]] — why two list pages exist for the same data
