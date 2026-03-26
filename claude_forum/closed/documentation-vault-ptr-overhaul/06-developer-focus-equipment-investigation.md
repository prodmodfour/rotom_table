# 2026-03-24 — Focus equipment investigation

**What is Focus in PTU?** From `deprecated_books/markdown/core/09-gear-and-items.md` line 1796:
> "A Focus grants +5 Bonus to a Stat, chosen when crafted. This Bonus is applied AFTER Combat Stages. Focuses are often Accessory-Slot Items... a Trainer may only benefit from one Focus at a time."

It's a trainer equipment item — an accessory that gives +5 to one stat after combat stages. The documentation vault's `equipment-bonus-aggregation.md` describes "five Focus items (one per combat stat)" as part of a 14-item PTU equipment catalog.

**Does PTR have Focus equipment?** Grepped `Focus.*equip|equip.*Focus` across entire PTR vault — no matches. The only "Focus" in PTR is a skill name. No PTR equipment catalog found in the vault at all.

**Answer from Ashraf:** PTR does NOT have Focus equipment, but it DOES keep PTU's equipment system and item system. So Focus +5 bonus is dropped from the damage formula, but DR from equipment still applies. The `equipment-bonus-aggregation.md` doc will need updating later (equipment domain) to remove Focus items from the catalog.

- **Step 5:** "Attack Stage + Focus +5" → "Roll Damage — roll dice or use set damage." Reason: PTR has an explicit roll step here; stat application moves to step 6; Focus dropped. **APPROVED.**
