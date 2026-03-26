Air Cutter appears in the [[encounter-act-modal-move-list]] as a pink/magenta (Flying-type) button showing "Air Cutter FLYING DB 6 At-Will AC 2".

The [[encounter-move-target-panel]] displays:
- Class: Special, DB: 6, AC: 2, Range: Cone 2
- SP.ATK stat of the attacker
- Effect text: "Air Cutter is a Critical Hit on 18+."

The Cone 2 range is an AoE pattern identical to [[acid-move-in-combat]], and the target list allows selecting multiple combatants within the cone. The expanded critical hit range (18+ instead of only 20) is described in the effect text and should be reflected in the move's `critRange` data field.

At-Will frequency means the move has no usage restrictions between turns.

## See also

- [[aeroblast-move-in-combat]] — another Flying AoE with expanded crit range (even-numbered)
- [[acid-move-in-combat]] — another Cone 2 AoE move
