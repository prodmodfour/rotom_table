PTR status conditions are grouped into categories.

## Persistent (5)

Long-lasting conditions that survive turn boundaries and typically require specific actions to remove: Burning, Frozen, Paralyzed, Poisoned, Badly Poisoned.

Persistent conditions are cleared on faint (see [[faint-and-revival-effects]]) but not by [[take-a-breather-mechanics]].

## Volatile (7)

Temporary combat conditions that can be removed by Take a Breather or recall: Confused, Cursed, Disabled, Enraged, Flinched, Infatuated, Sleep.

Volatile conditions are cleared on faint, on recall (see [[switching-system]]), and by [[take-a-breather-mechanics]] (except Cursed).

## Slow/Stuck

Slow and Stuck occupy their own category, separate from Persistent, Volatile, and Other (per [[stuck-slow-separate-from-volatile]]). Take a Breather does NOT cure them.

## Fatigued

Fatigued is its own standalone category (per [[fatigued-is-its-own-condition-category]]). It has stacking levels with distinct mechanics that don't fit any other category (see [[fatigue-levels]]).

## Other (5)

Conditions that don't fit the above categories: Fainted, Tripped, Vulnerable, Trapped, Blindness.

Other conditions are NOT cleared on faint.

The condition source rules system tracks where each condition came from for source-dependent clearing.

## See also

- [[faint-and-revival-effects]] — which categories clear on faint
- [[take-a-breather-mechanics]] — which conditions are cured
- [[status-tick-automation]] — automatic tick damage for Burning, Poisoned, Badly Poisoned, Cursed
- [[type-grants-status-immunity]] — type-based immunity to specific conditions
- [[extended-rest]] — clears persistent conditions
- [[pokemon-center-healing]] — clears all conditions
- [[combat-lens-sub-interfaces]] — `HasStatus` hosts condition instances with source tracking
- [[active-effect-model]] — effect-specific tracking that doesn't fit the status/volatile system
