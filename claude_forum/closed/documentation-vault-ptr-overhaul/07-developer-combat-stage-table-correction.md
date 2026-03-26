# 2026-03-24 — Combat stage table correction

**PTR vault note `combat-stage-asymmetric-scaling.md` has wrong multiplier values.** PTR should use PTU's combat stage table, not the asymmetric one currently described. The PTR vault note needs correcting.

PTU table (correct for PTR): -6=0.4, -5=0.5, -4=0.57, -3=0.67, -2=0.8, -1=0.9, 0=1.0, +1=1.1, +2=1.2, +3=1.33, +4=1.5, +5=1.67, +6=2.0

**Action needed:** Update `vaults/ptr/rules/combat-stage-asymmetric-scaling.md` with correct values. May also need renaming since "asymmetric" may no longer describe the table accurately.

**FIXED.** Updated multiplier values to PTU's table. Kept filename — "asymmetric" still describes the table (buffs range wider than debuffs). Removed false "+20%/-10% per stage" characterization. **APPROVED.**

- **Step 6:** "Defense Stage — subtract defense + Focus +5" → "Add Attacker's Stat — attack stat with combat stage multipliers, plus flat bonuses." Reason: old step 5's attack stat moves here, Focus dropped, link updated to [[combat-stage-asymmetric-scaling]]. Defense moves to step 7. **APPROVED.**
- **Step 7:** "Damage Reduction (DR) — equipment DR only" → "Subtract Defender's Stat and DR — defense stat + DR combined, min floor of 1." Reason: PTR combines defense and DR in one step; adds first minimum floor per [[non-immune-attacks-deal-damage]]. **APPROVED.**
- **Step 8:** Add second min floor of 1 (only immunity = 0) and [[trainers-are-typeless]] skip. Reason: two floors per [[non-immune-attacks-deal-damage]], trainers have no type. **APPROVED.**
- **Step 9:** "Floor — min 1" → "Apply to HP — subtract from HP and check injuries." Reason: floors now inline at steps 7-8; PTR step 9 is HP application + injury check. **APPROVED.**
- **Opening line:** PTU → PTR. **APPROVED.**
- **See-also:** [[combat-stage-system]] → [[combat-stage-asymmetric-scaling]] with corrected step numbers; added [[non-immune-attacks-deal-damage]]. **APPROVED.**

**All 9 steps applied to `nine-step-damage-formula.md`.**

- **`damage-flow-pipeline.md`:** "PTU 9-step" → "PTR 9-step". **APPROVED & APPLIED.**
- **`damage-pipeline-as-chain-of-responsibility.md`:** "PTU calculation" → "PTR calculation". **APPROVED & APPLIED.**
