The seed data in `seed-encounter-tables.ts` uses a 4-tier weight scale: common=60, uncommon=25, rare=10, veryRare=5. This differs from the `RARITY_WEIGHTS` constant used by the UI's rarity preset selector: Common=10, Uncommon=5, Rare=3, Very Rare=1, Legendary=0.1.

The ratios are similar but not identical. The seed scale has a wider spread (60:5 = 12:1 for common-to-rare) compared to the UI presets (10:1 = 10:1). Since [[habitat-weight-determines-encounter-chance]] is calculated as a proportion of total weight, the actual encounter probabilities depend on the mix of species in a given table rather than the absolute weight values.

## See also

- [[habitat-add-pokemon-modal]] — where the rarity presets are offered to the user
