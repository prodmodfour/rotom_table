PTU status conditions are grouped into three categories, defined in the `STATUS_CONDITIONS` constant in `constants/combat.ts`.

## Persistent (5)

Long-lasting conditions that survive turn boundaries and typically require specific actions to remove: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned.

Persistent conditions are cleared on faint (see [[faint-and-revival-effects]]) but not by [[take-a-breather-mechanics]].

## Volatile (9)

Temporary combat conditions that can be removed by Take a Breather or recall: Confused, Cursed, Disabled, Enraged, Flinched, Infatuated, Sleep, Slowed, Suppressed.

Volatile conditions are cleared on faint, on recall (see [[switching-system]]), and by [[take-a-breather-mechanics]] (except Cursed).

## Other (6)

Conditions that don't fit the persistent/volatile model: Fainted, Stuck, Tripped, Vulnerable, Trapped, Blindness.

Other conditions are NOT cleared on faint. Slowed and Stuck are cured by [[take-a-breather-mechanics]] despite being in the Other category.

## Implementation

The `updateStatusConditions` service function validates incoming conditions against these categories and prevents duplicates. A CSS class mapper function provides styling per category. The [[condition-source-rules]] system tracks where each condition came from for source-dependent clearing.

## See also

- [[faint-and-revival-effects]] — which categories clear on faint
- [[take-a-breather-mechanics]] — which conditions are cured
- [[status-tick-automation]] — automatic tick damage for Burned, Poisoned, Badly Poisoned, Cursed
- [[type-status-immunity-utility]] — type-based immunity to specific conditions
- [[extended-rest]] — clears persistent conditions
- [[pokemon-center-healing]] — clears all conditions
