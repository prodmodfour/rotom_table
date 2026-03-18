# Generate Wild Encounter Modal

A modal titled "Generate Wild Encounter" opened by the Generate button on the [[habitat-detail-page]].

Sections from top to bottom:

1. **Table summary card** — name, description, level range badge, density badge, species count badge
2. **Budget Guide** — inputs for "Avg Pokemon Lv." and "Players" with the message "Enter party info above to see budget guidance" when empty
3. **Spawn Count** — editable number input, defaulting to the [[population-density-label]] suggestion (e.g. 4 for Moderate)
4. **Apply Modification** — dropdown listing "None (Base Table)" plus any [[habitat-sub-habitats|sub-habitats]] (e.g. "Night"). Selecting a sub-habitat changes entry weights before rolling
5. **Override Level Range** — checkbox to use custom level bounds instead of the table's defaults
6. **Encounter Significance** — radio buttons: Insignificant (x1), Everyday (x2), Significant (x5). Label: "Scales XP rewards when creating a new encounter (PTU p.460)"
7. **Encounter Pool** — read-only list of all species (from [[species-data-model-fields]] entries) in the table with their current chance percentages

Buttons: "Cancel" and "Generate".

## See also

- [[encounter-generation-uses-weighted-random-with-diversity-decay]] — the algorithm behind the Generate button
- [[store-resolves-entries-by-merging-parent-with-modification]] — how the encounter pool is computed when a sub-habitat is selected
