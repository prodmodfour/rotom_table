The ability assignment utility (`app/utils/abilityAssignment.ts`) divides a species' flat abilities array into three tiers using positional indexing and `numBasicAbilities` from the [[species-data-model-fields]]:

- Indices `0` to `numBasicAbilities - 1` → **Basic**
- Remaining indices up to the second-to-last → **Advanced**
- The final index (when the list is long enough) → **High**

This categorization drives the [[pokemon-ability-milestone-assignment]] pools: at level 20, the Pokemon can choose from Basic and Advanced abilities it doesn't already have; at level 40, High abilities also become available.

The [[pokemon-generator-service]] picks one random Basic ability at creation time, and the [[evolution-service]] remaps abilities by positional index when a species changes.