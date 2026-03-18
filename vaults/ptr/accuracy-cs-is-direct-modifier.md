Accuracy combat stages work differently from stat combat stages. Instead of applying a multiplier to a base stat, accuracy CS adds or subtracts directly from accuracy rolls. Accuracy at -2 simply means -2 to all accuracy rolls.

Accuracy has a base of 0 and uses the same -6 to +6 stage range as [[combat-stage-asymmetric-scaling]], but the implementation path is different: stats use a multiplier table, accuracy uses direct addition. The app must handle these two CS applications separately.

## See also

- [[six-trainer-combat-stats]]
- [[modifiers-dont-shift-effect-triggers]]
