# Habitats List Page

Accessed at `/gm/habitats` via the Habitats link in the [[gm-navigation-bar]]. The page heading reads "Encounter Tables" with the subtitle "Manage habitats and encounter pools for wild Pokemon generation."

This page shows the same underlying encounter table data as the [[encounter-tables-list-page]], but with a different card layout: each card shows Pokemon as sprite images rather than text-based rarity lists, and displays level range, density, and species count as compact badges (e.g. "Lv. 3-10", "Moderate", "8 species").

Has a "+ New Table" button that opens the [[encounter-table-create-modal]], a search textbox, and a "Sort by Name" dropdown. Cards with more than ~8 species show a "+N" overflow indicator on the sprite row.

Clicking a card navigates to the [[habitat-detail-page]] at `/gm/habitats/:id`.

## See also

- [[encounter-tables-list-page]] — the text-based alternative view at `/gm/encounter-tables`
- [[encounter-tables-have-two-parallel-ui-surfaces]] — why two list pages exist for the same data
