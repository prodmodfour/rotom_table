The file `app/constants/livingWeapon.ts` defines `LIVING_WEAPON_CONFIG` for the Honedge evolutionary line (PTU pp.305-306), mapping three species to their weapon configurations:

**Honedge** — Simple weapon, main hand only. Grants Wounding Strike (DB 7, EOT, AC 4, requires Adept Combat).

**Doublade** — Simple weapon, both hands. +2 Evasion bonus when dual-wielded. Grants Double Swipe (DB 5, EOT, AC 4, hits 2 targets or Double Strike, requires Adept Combat).

**Aegislash** — Fine weapon, both hands. Grants a shield. Grants Wounding Strike and Bleed (DB 10, Scene x2, AC 3, tick damage over 3 turns, requires Master Combat).

Damage Base values include the Small Melee Weapon +1 DB modifier (PTU p.287) pre-baked in. Moves are gated by the wielder's Combat skill rank (Adept or Master).

`LIVING_WEAPON_SPECIES` lists the three eligible species names. The [[living-weapon-state-reconstructed-on-load]] describes how wield relationships are derived at runtime rather than stored.
