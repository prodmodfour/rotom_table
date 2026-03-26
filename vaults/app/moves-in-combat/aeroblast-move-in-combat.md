Aeroblast appears in the [[encounter-act-modal-move-list]] as a pink/magenta (Flying-type) button showing "Aeroblast FLYING DB 10 Daily AC 3".

The [[encounter-move-target-panel]] displays:
- Class: Special, DB: 10, AC: 3, Range: Line 6
- SP.ATK stat of the attacker
- Effect text: "Aeroblast is a Critical Hit on an Even-Numbered Roll."

The Line 6 range is an AoE pattern, and the target list allows selecting multiple combatants. AC 3 is higher than the typical AC 2, making the move slightly less accurate. The expanded critical hit range (even-numbered rolls instead of only 20) is described in the effect text. The app uses the move's stored `critRange` value to determine crits during the accuracy roll phase, so this should function automatically if the `critRange` is set to 2 in the move data.

Daily frequency means the move can only be used once per day.

## See also

- [[air-cutter-move-in-combat]] — another AoE Flying move with expanded crit range
- [[move-frequency-utility]] — Daily frequency enforcement
