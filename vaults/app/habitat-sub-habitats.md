# Habitat Sub-habitats

A section on the [[habitat-detail-page]] under the heading "Sub-habitats (N)" with a "+ Add Sub-habitat" button.

Each sub-habitat shows:

- **Name** as a heading (e.g. "Night")
- **Description** (e.g. "Nighttime in the village")
- Edit icon button — opens the [[habitat-edit-sub-habitat-modal]]
- Delete icon button
- **Changes** count
- **Modifications** list — each modification shows an arrow icon (↔), the affected Pokemon name, and the modified value (e.g. "Weight: 60")
- "+ Add Change" button — opens the [[habitat-add-modification-entry-modal]]

New sub-habitats are created via the [[habitat-create-sub-habitat-modal]].

Sub-habitat modifications alter [[habitat-weight-determines-encounter-chance|entry weights]] when selected during encounter generation. In the [[generate-wild-encounter-modal]], the "Apply Modification" dropdown lets the GM choose a sub-habitat to apply.

## See also

- [[store-resolves-entries-by-merging-parent-with-modification]] — how the store computes the merged entry list
- [[modification-entry-references-species-by-name-not-id]] — why modification entries use species names rather than IDs
- [[modification-card-shows-change-type-indicators]] — the visual +/−/arrow indicators for change types
