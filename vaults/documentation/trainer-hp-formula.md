Trainer HP = `(level * 2) + (baseHp * 3) + 10`.

The doubled level coefficient (compared to [[pokemon-hp-formula]]'s single level coefficient) gives trainers more HP scaling per level. This makes trainers progressively tougher relative to their Pokemon as they level up.

The app computes this automatically as part of [[automate-routine-bookkeeping]], recalculating whenever the trainer levels up or base HP changes. The trainer never manually enters their HP total.

## See also
- [[automate-routine-bookkeeping]]
- [[pokemon-hp-formula]]
- [[trainer-derived-stats]]
