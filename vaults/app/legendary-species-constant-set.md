A hardcoded set of legendary and mythical species names lives in `app/constants/legendarySpecies.ts`, covering Gen 1–8 plus Hisui forms. The `isLegendarySpecies()` function checks membership by name.

This set is used in capture rate calculations — legendary Pokemon subtract 30 from the capture rate per PTU rules. It operates independently from the [[species-data-model-fields]], relying on name matching rather than a database flag.
