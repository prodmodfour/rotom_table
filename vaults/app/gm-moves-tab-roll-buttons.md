Each [[gm-moves-tab-move-card]] can have up to three roll buttons at the bottom, separated from the move details by a horizontal border:

- **Attack (AC N)** — appears only for moves with a non-null AC value. Emits a `roll-attack` event handled by [[pokemon-sheet-rolls-composable]].
- **Damage** — appears only for moves with a non-null `damageBase`. Emits a `roll-damage` event with `isCrit: false`.
- **Crit!** — appears alongside the Damage button for damaging moves. Uses an accent style. Emits a `roll-damage` event with `isCrit: true`.

Status moves with no AC (auto-hit) and no damage base show no roll buttons at all. Variable-damage moves like [[beat-up-counter-bide-have-variable-damage-bases]] also show no Damage/Crit buttons since their `damageBase` is null.
