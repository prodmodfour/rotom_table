Aerial Ace appears in the [[encounter-act-modal-move-list]] as a pink/magenta (Flying-type) button showing "Aerial Ace FLYING DB 6 EOT". No AC is displayed because the move auto-hits.

The [[encounter-move-target-panel]] displays:
- Class: Physical, DB: 6, Range: Melee, 1 Target
- ATK stat of the attacker
- No AC field in the info card
- Effect text: "Aerial Ace cannot miss."

Because Aerial Ace has no AC value (null in the data), the target panel skips the accuracy roll phase entirely. After selecting a target, the damage section (DB 6: 2d6+8) and "Roll Damage" button appear immediately with no accuracy check needed. This is the app's standard behavior for auto-hit moves — moves with null AC bypass the accuracy step.

## See also

- [[absorb-move-in-combat]] — standard damaging move that requires accuracy roll for comparison
- [[encounter-move-target-panel]]
