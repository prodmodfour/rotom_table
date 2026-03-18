# Habitat Weight Determines Encounter Chance

Each entry in the [[habitat-pokemon-entries-table]] has a Weight value. The Chance percentage displayed for each entry equals its Weight divided by the Total Weight (shown in the [[habitat-detail-page]] metadata).

For example, in a table with total weight 270: an entry with weight 60 shows 22.2% (60/270), and an entry with weight 5 shows 1.9% (5/270).

[[habitat-sub-habitats]] can modify entry weights, which changes the effective encounter chances when a sub-habitat is active during generation. The [[store-resolves-entries-by-merging-parent-with-modification]] getter computes the merged weights used for generation.

## See also

- [[store-does-optimistic-update-for-entry-weight]] — how inline weight edits update the displayed chance immediately
- [[encounter-generation-uses-weighted-random-with-diversity-decay]] — how the weights translate to actual encounter rolls
