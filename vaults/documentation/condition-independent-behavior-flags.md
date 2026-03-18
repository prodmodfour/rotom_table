Each status condition carries its own set of behavior flags — `clears-on-recall`, `clears-on-faint`, `clears-on-encounter-end`, `clears-on-breather` — as per-condition data rather than deriving them from the condition's category (volatile, persistent, other).

This [[decouple-behaviors-from-categories|decouples mechanical behavior from organizational grouping]]. The old pattern of `RECALL_CLEARED_CONDITIONS = [...VOLATILE_CONDITIONS]` collapsed two distinct concepts: what a condition *is* (its category) and what a condition *does* (its behavior on game events). By making flags explicit per-condition, we can represent cases like Sleep being volatile but not clearing on recall, without hardcoded exceptions.

The flags are simple booleans stored alongside each condition's definition. The condition system reads them directly when processing game events (recall, faint, encounter end, Take a Breather) instead of looking up the condition's category and inferring behavior.

This is an application of [[specific-text-over-general-category]] — the specific flag on the condition overrides any general assumption from its category membership.

## See also
- [[decouple-behaviors-from-categories]] — the design principle this implements
- [[specific-text-over-general-category]] — the underlying rule: specific text wins
- [[status-condition-categories]] — the categories these flags replace as behavior sources
- [[sleep-volatile-but-persists]] — the motivating case for per-condition flags
