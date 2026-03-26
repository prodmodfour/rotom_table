# 2026-03-24 — Detour: PTR vault equipment/item system gap analysis

Before continuing combat domain, Ashraf asked to check if the PTR vault is missing the equipment/item system from PTU.

**What PTR vault currently has:**
- `items-unchanged-from-ptu.md` — one-liner: "item system is unchanged from PTU 1.05"
- `restorative-items-catalog.md` — lists basic HP restoratives (Potion, Super Potion, etc.)
- `status-cure-items-catalog.md` — lists status cure items (Antidote, Paralyze Heal, etc.)
- `applying-items-action-economy.md` — Standard/Full-Round action costs for items
- ~15 Poke Ball notes (capture workflow, ball types, modifiers, recall range)

**What PTU Chapter 9 covers (deprecated_books/markdown/core/09-gear-and-items.md):**
1. Poke Balls (p.271-276) — ball chart, capture mechanics
2. Pokedex (p.271)
3. Medicines/Restoratives (p.280-282) — potions, status heals, X items
4. Bandages and Poultices (p.283-284)
5. Food Items / Snacks (p.285-286) — Candy Bar, Honey, Leftovers, Black Sludge
6. Refreshments (p.286) — Enriched Water, Super Soda Pop, etc.
7. Berries (p.287-302) — massive berry chart with ~60 berries
8. Crafting Kits (p.293-294)
9. Scrap and Crafting Items (p.295)
10. Baby Food (p.295)
11. Equipment — Body (Light/Heavy Armor), Head (Goggles, Gas Mask, Helmet), Feet (Snow Boots, Running Shoes), Hand (Shields, Nets, Fishing Rod), Accessory (Focus, Snag Machine, Mega Ring)
12. Weapons (p.296-300) — weapon moves, crude/simple/fine weapons
13. Held Items (p.302-305) — ~40 held items
14. Evolutionary Items (p.306-307) — stones, keepsakes
15. Vitamins (p.308)
16. TMs and HMs (p.309-310)
17. Combat Items (p.311) — Pester Balls, Cleanse Tags

**Gap:** The PTR vault has a blanket "unchanged from PTU" note but doesn't actually document most of the system. Only restoratives, status cures, action economy, and Poke Balls have their own notes.

**PTR-specific changes needed (known so far):**
- Focus equipment: DROPPED (confirmed by Ashraf)
- TMs/HMs: may be irrelevant since PTR has no per-species move lists (any Pokemon can learn any move via unlock conditions)
- Abilities/Features/Edges referenced by items → now Traits
- Move frequencies referenced by items → now Energy

**Decision:** This gap will be handled in a separate thread — a final PTU-to-PTR digestion pass across all of Chapter 9 (and potentially other PTU book content, not just items/equipment).
