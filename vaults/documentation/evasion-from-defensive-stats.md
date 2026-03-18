Physical, Special, and Speed evasion each equal `floor(calculatedStat / 5)`.

Calculated stats include base stat + level-up allocation + nature modifier. Combat stages and temporary buffs do not factor into the evasion base — only the persistent calculated stat matters.

The app derives evasion automatically whenever stats change, as part of [[automate-routine-bookkeeping]]. Max evasion modifier is +6, enforced by the [[combat-stage-system]].

## See also
- [[automate-routine-bookkeeping]]
- [[evasion-and-accuracy-system]]
- [[combat-stage-system]]
- [[pokemon-stat-allocation]]
