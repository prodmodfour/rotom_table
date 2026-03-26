# 2026-03-26 — PTR Vault Check: Trainer Combat Capabilities

Checked 12 vault notes to determine which sub-interfaces trainers implement. Result: trainers are near-identical to Pokemon in combat capability. The state inventory's one-liner ("parallel structure, subset of fields") was wrong — it's not a subset, it's almost the full set.

---

## Evidence from PTR vault

| Source | What it says |
|---|---|
| `six-trainer-combat-stats.md` | Trainers have 7 combat stats: HP, Atk, Def, SpAtk, SpDef, Spd, Stamina. All derived traits (HP formula, evasion, damage) flow from these. |
| `trainers-are-typeless.md` | Trainers have no type. Skip type effectiveness step entirely. No STAB. All attacks deal neutral damage. |
| `only-pokemon-have-levels.md` | Trainers have no levels. No level component in any formula. |
| `trainer-hp-formula.md` | Trainer Health = (HP stat × 3) + 10. Different formula from Pokemon but same lens fields (hpDelta, tempHp, injuries). |
| `trainer-move-list.md` | Trainers CAN unlock moves from the universal move pool, same as Pokemon. There is no separate trainer move list. |
| `trainers-are-human-species.md` | Human species defines base stats, movement, and size. |
| `trainer-size-medium-default.md` | Medium size, WC 3–5 depending on weight. |
| `combat-stage-asymmetric-scaling.md` | CS applies to Atk, Def, SpAtk, SpDef, Spd. See-also links to `six-trainer-combat-stats.md` — trainers receive combat stages. |
| `stamina-stat.md` | Stamina derives Energy. Links to `six-trainer-combat-stats.md` — trainers have Energy. |
| `action-economy-per-turn.md` | Each combatant (trainer or Pokemon) gets Standard + Movement + Swift + Free. |
| `two-turns-per-player-per-round.md` | Trainer and each active Pokemon are separate combatants with separate turns. |
| `fainted-at-zero-hp.md` | "A Pokemon **or Trainer** at 0 HP or lower is Fainted." Trainers can faint. |
| `death-at-ten-injuries-or-negative-hp.md` | "A Pokemon **or Trainer** dies if..." Same death rules. |
| `combat-maneuvers-use-opposed-checks.md` | Both trainers and Pokemon use combat maneuvers. Trainers also have exclusive **Manipulate maneuvers** (Bon Mot, Flirt, Terrorize) using social skills. |
| `mounting-and-mounted-combat.md` | Trainers can mount Pokemon (Standard Action, DC 10 check). |
| `energy-for-extra-movement.md` | "A character" can spend 5 Energy for extra movement — applies to trainers too. |
| `movement-traits.md` | Movement traits grant X movement per mode. Humans are Landwalker (implied by species). |

---

## Sub-interface mapping

| Sub-interface | Pokemon | Trainer | Notes |
|---|---|---|---|
| `HasIdentity` | Yes | Yes | |
| `HasTypes` | Yes | **No** | Trainers are typeless. Skip type effectiveness, no STAB. This is the ONE interface trainers don't implement. |
| `HasStats` | Yes | Yes | Same 7 stats (HP, Atk, Def, SpAtk, SpDef, Spd, Stamina) |
| `HasCombatStages` | Yes | Yes | Same 7 stages |
| `HasHealth` | Yes | Yes | Different HP formula, same lens fields |
| `HasEnergy` | Yes | Yes | Stamina → Energy, same mechanics |
| `HasStatus` | Yes | Yes | Trainers can be statused, fainted |
| `HasPosition` | Yes | Yes | On the grid |
| `HasInitiative` | Yes | Yes | Own turn in initiative |
| `HasActions` | Yes | Yes | Standard + Movement + Swift + Free |
| `HasInventory` | Yes | Yes | Held items, equipment, usable items |
| `HasMovement` | Yes | Yes | Landwalker (Human species); can gain others via traits |
| `HasMoves` | Yes | Yes | Universal move pool — trainers unlock moves too |
| `HasTraits` | Yes | Yes | Trainers can have traits |
| `HasActiveEffects` | Yes | Yes | Can receive buffs/debuffs |
| `HasPersistentResources` | Yes | Maybe | Could have Mettle or similar persistent tracking |

---

## Architectural implication

The finding 29 concern about `[[alternative-classes-with-different-interfaces-smell]]` is resolved: **trainers and Pokemon implement the same interfaces.** The only difference is `HasTypes` — trainers don't implement it.

This means:
1. Effects that depend on `HasTypes` (STAB, type effectiveness, type immunity, absorb traits) correctly exclude trainers — they never receive `HasTypes`.
2. Every other effect atom works identically on both entity types.
3. The `entityType` discriminator (finding 32, already moved to entity) is needed ONLY for: HP formula selection, display rendering, and trainer-exclusive actions (Manipulate maneuvers, item use, Poke Ball throwing, Pokedex).
4. No `[[refused-bequest-smell]]` — trainers don't implement HasMoves with an empty array; they genuinely can have moves.

**What's different about trainers in combat (not captured by sub-interfaces):**
- **HP formula:** `(HP × 3) + 10` vs Pokemon's `HP + (Level × 3) + 10`
- **No levels:** No level component in any calculation
- **Trainer-exclusive Standard Actions:** Use items on Pokemon, throw Poke Balls, use Pokedex, Manipulate maneuvers (social combat)
- **Mounting:** Can mount as Standard Action (or Free Action with Expert+ Acrobatics/Athletics)
- **Take a Breather assist:** Can assist another combatant's Take a Breather (Full Action + Interrupt from target, DC 12 Command)

These differences live on the entity (formula selection, available actions) — not on the lens sub-interfaces.

