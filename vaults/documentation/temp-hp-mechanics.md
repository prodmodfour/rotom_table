Temporary HP acts as a damage buffer that absorbs hits before real HP is touched.

## Damage Absorption

When damage is applied, temp HP absorbs it first. If temp HP is reduced to 0, remaining damage carries through to real HP and the [[hp-injury-system]] (markers, massive damage).

## No Stacking

Temp HP does not stack. When new temp HP is granted, the system keeps the **higher** of the old and new values. This prevents multiplicative temp HP accumulation.

## Healing Interaction

The heal endpoint can grant temp HP separately from regular HP healing. The same no-stacking rule applies — the higher value wins.

## Removal

[[take-a-breather-mechanics]] explicitly removes all temp HP as part of the stage/condition reset.

## See also

- [[hp-injury-system]] — real HP damage that occurs after temp HP is depleted
- [[healing-mechanics]] — how temp HP interacts with healing
- [[take-a-breather-mechanics]] — clears temp HP
