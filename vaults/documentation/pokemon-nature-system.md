# Pokemon Nature System

36 natures defined in `NATURE_TABLE` (`constants/natures.ts`), each mapping a name to `{ raise, lower }` stat keys. 30 natures have distinct raise/lower stats; 6 neutral natures (Composed, Hardy, Docile, Bashful, Quirky, Serious) have raise === lower and produce no stat change.

## Stat Modifiers

`applyNatureToBaseStats()` is a pure function that returns a new stats object with nature modifiers applied. HP uses +1/−1, non-HP stats use +2/−2. Stats are floored at 1. Neutral natures return an unmodified copy. The function does not mutate its input.

## Storage

The nature is stored as a [[json-as-text-columns|JSON-as-TEXT]] field on the Pokemon model: `{ name, raisedStat, loweredStat }`. It is randomly selected during Pokemon generation by the [[pokemon-generator-entry-point]].

## Display

The [[pokemon-sheet-page]] stats tab shows the nature with raised/lowered stat indicators.

## See also

- [[pokemon-generator-entry-point]] — rolls and applies nature at creation
- [[pokemon-experience-chart]] — level-up does not change nature
