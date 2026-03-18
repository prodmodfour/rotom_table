# Encounter Status Conditions Modal

A modal opened by clicking the "ST" button on an [[encounter-combatant-card]]. The title reads "Status Conditions - [Name]".

The modal displays a three-column grid of checkboxes for 21 status conditions:

- Burned, Frozen, Paralyzed
- Poisoned, Badly Poisoned, Asleep
- Bad Sleep, Confused, Flinched
- Infatuated, Cursed, Disabled
- Enraged, Suppressed, Fainted
- Dead, Stuck, Slowed
- Trapped, Tripped, Vulnerable

Footer buttons: **Clear All** and **Save Changes**.

The underlying data model for these conditions — categories, clearing flags, and combat stage effects — is defined in [[status-condition-definitions-constant]]. Source-based clearing overrides are handled by [[condition-source-clearing-rules]].
