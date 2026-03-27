# 2026-03-26 — Flying Type Removed: Documentation Vault and Engine Updated

PTR uses 17 types — Flying has been removed. The PTR vault was already correct (`type-effectiveness-chart.md` lists 17 types, `seventeen-pokemon-types.md` omits Flying, all formerly-Flying PTR moves are typed Normal). The documentation vault and engine code still referenced the 18-type system with Flying. This post documents the alignment.

## What changed in PTR

- **Flying is not a Pokemon type.** The 17 PTR types are: Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy.
- **Formerly-Flying moves became Normal-type.** Aerial Ace, Brave Bird, Hurricane, Wing Attack, Roost, etc. are all Normal-type in the PTR moves vault.
- **The Flier trait replaces Flying-type's mechanical role.** Ground immunity, elevation, and aerial movement are governed by the Flier movement trait, not by type. Gravity, Sticky Web, and similar effects check for the Flier trait, not a Flying type.
- **Roost lost its type-removal effect.** PTR Roost is a self-heal only — no "loses Flying Type until next turn" mechanic, because there is no Flying type to lose.
- **The type effectiveness chart is 17x17.** Electric no longer has a super-effective target from Flying. Ice, Rock, and Bug lose a super-effective target. Fighting loses a resistance. Ground loses an immunity. These are all consequences of removing one row and one column.

## Engine code changes

**`base.ts`** — Removed `'flying'` from the `PokemonType` union type. Comment updated from "18-type system" to "PTR uses 17 types (Flying removed)."

**`constants.ts`** — Rebuilt `TYPE_EFFECTIVENESS` chart:
- Deleted the `flying` attacking row entirely
- Removed `flying` from all defending entries: `electric` (lost SE vs flying), `grass` (lost resist vs flying), `ice` (lost SE vs flying), `fighting` (lost resist vs flying), `ground` (lost immune vs flying), `bug` (lost resist vs flying), `rock` (lost SE vs flying)
- Comment updated from "18-type system" to "PTR uses 17 types"

## Documentation vault changes

**Move implementations (15 files)** — Updated `type: "Flying"` → `type: "Normal"` and `STAB for Flying-type users` → `STAB for Normal-type users`:
- `aerial-ace.md`, `acrobatics.md`, `air-cutter.md`, `air-slash.md`, `brave-bird.md`, `defog.md`, `drill-peck.md`, `feather-dance.md`, `gust.md`, `hurricane.md`, `peck.md`, `pluck.md`, `sky-attack.md`, `tailwind.md`, `wing-attack.md`

**`roost.md`** — Type changed to Normal. Removed the "loses Flying Type until next turn" effect entirely per PTR vault.

**`sticky-web.md`** — Removed "Flying-type Pokemon and" from the immunity clause. Now reads: "Pokemon and Trainers with the Flier trait are not affected by Sticky Web."

**`gravity.md`** — Changed "Flying-Types and Flier-trait Pokemon lose Ground-Type immunity" → "Flier-trait Pokemon lose Ground-Type immunity."

**`type-grants-status-immunity.md`** — Changed dual-type example from "Fire/Flying" to "Fire/Steel."

**`move-observation-index.md`** — Renamed section header from "## Flying (28)" to "## Formerly Flying — now Normal (28)". Added clarification note that the 18-type count reflects old PTU classification.

## Files NOT changed (correctly reference flight, not Flying type)

- `elevation-system.md` — "Flying Pokemon" means Pokemon with the Flier trait; links to `[[flier]]` correctly
- `pathfinding-algorithm.md` — same usage, links to Flier trait
- `combatant-movement-capabilities.md` — documents `combatantCanFly()` which checks Flier speed
- `vtt-grid-composables.md` — references flying defaults, meaning Flier trait
- `liskov-substitution-principle.md` — uses "flying" as a generic analogy about birds, not a Pokemon type

## Verification

- `tsc --noEmit` — clean compile, zero errors
- 54 tests passing, no regressions
- `grep -r "flying" packages/engine/` — zero matches
- `grep -r '"Flying"' vaults/documentation/` — zero matches
- `grep -r 'Flying-type' vaults/documentation/` — zero matches

**Status:** Documentation vault and engine code aligned with PTR's 17-type system. Flying type fully removed from all authoritative sources.
