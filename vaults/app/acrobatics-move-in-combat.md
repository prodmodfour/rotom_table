Acrobatics appears in the [[encounter-act-modal-move-list]] as a pink/magenta (Flying-type) button showing "Acrobatics FLYING DB 6 EOT AC 2".

The [[encounter-move-target-panel]] displays:
- Class: Physical, DB: 6, AC: 2, Range: Melee, Dash, 1 Target
- ATK stat of the attacker
- Effect text: "If the user is not holding an item, Acrobatics instead has a Damage Base of 11 (3d10+10/27)"

The range includes the "Dash" keyword, which in PTU allows the user to move and attack in the same Standard Action. The app displays this keyword in the range string but does not enforce or automate the dash movement.

The conditional DB boost (6 → 11 when no held item) is described in the effect text. The app always uses the base DB of 6 regardless of the user's held item status — the GM must manually override the damage if the condition applies.

## See also

- [[accelerock-move-in-combat]] — another Physical move with a keyword in the range (Priority)
- [[encounter-move-target-panel]]
