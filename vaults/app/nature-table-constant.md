The file `app/constants/natures.ts` defines all 36 PTU Pokemon natures as `NATURE_TABLE`, a `Record<string, NatureModifiers>` where each entry specifies a `raise` and `lower` stat.

Natures are grouped by the stat they raise — six natures per stat (HP, Attack, Defense, Special Attack, Special Defense, Speed). Within each group, five natures lower a different stat, and one is neutral (raise === lower). The six neutral natures are Composed, Hardy, Docile, Bashful, Quirky, and Serious.

The `applyNatureToBaseStats()` function applies a nature's modifier to a base stats object. HP modifiers use +1/-1; all other stats use +2/-2. Stat values are floored at 1. The function returns a new object (immutable).

The [[nature-display-on-pokemon-stats-tab]] shows the result on the Pokemon detail page. The [[pokemon-generator-service]] assigns a random nature during wild Pokemon generation, while [[pokemon-creation-produces-manual-record|manual creation]] does not assign a nature.
