Other category conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) have `clearsOnFaint: false` as the static default, matching explicit mention of only Persistent and Volatile conditions.

Whether an Other condition clears on faint depends on what applied it, not on the condition itself. A move-inflicted Stuck should clear (the move effect is gone), but terrain-based Stuck should not (the terrain is still there). This requires [[condition-source-tracking]].

## See also

- [[decouple-behaviors-from-categories]]
- [[recall-clears-then-source-reapplies]]
