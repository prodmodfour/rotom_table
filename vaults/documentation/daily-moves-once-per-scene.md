Daily-frequency moves have a per-scene usage cap in addition to their daily limit. A Daily x2 move can be used at most once per scene (or twice if Daily x2 per scene), preventing a trainer from burning all daily uses in a single encounter.

The [[move-frequency-system]] tracks both `usedToday` and `usedThisScene` counters. When a daily move is used, both counters increment. The scene counter resets via [[scene-activation-resets-move-counters]] but the daily counter persists until a rest.

## See also

- [[move-frequency-system]] — enforces both daily and per-scene limits
- [[scene-activation-resets-move-counters]] — resets the per-scene counter on new scene
