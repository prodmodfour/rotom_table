---
domain: pokemon-lifecycle
type: audit-tier
tier: 3
name: Data Model and Enumerations
items_audited: 7
correct: 7
incorrect: 0
approximation: 0
ambiguous: 0
audited_at: 2026-03-05T18:00:00Z
audited_by: implementation-auditor
session: 121
---

# Tier 3: Data Model and Enumerations

7 items verifying data model completeness and enumeration correctness.

---

## Item 18: R003 -- Base Stats Definition (C001, C002)

**Rule:** PTU p.197-198: Pokemon have 6 base stats: HP, Attack, Defense, Special Attack, Special Defense, Speed.

**Expected behavior:** All 6 base stats stored on Pokemon model and SpeciesData model.

**Actual behavior:**
- **Pokemon model** (`app/prisma/schema.prisma:110-116`): `baseHp`, `baseAttack`, `baseDefense`, `baseSpAtk`, `baseSpDef`, `baseSpeed` -- 6 stats stored as integers.
- **SpeciesData model**: `baseHp`, `baseAttack`, `baseDefense`, `baseSpAtk`, `baseSpDef`, `baseSpeed` -- 6 stats seeded from pokedex.
- **Serialization** (`app/server/utils/serializers.ts:217-224`): `serializePokemon()` maps DB columns to `baseStats: { hp, attack, defense, specialAttack, specialDefense, speed }`.
- **Generator** (`app/server/services/pokemon-generator.service.ts:107-114`): Reads all 6 base stats from SpeciesData and maps to the same object shape.

**Classification:** Correct

---

## Item 19: R004 -- Pokemon Types (C001, C002)

**Rule:** PTU p.198: "Each Pokemon has one or two elemental Types, chosen from the 18 Types in Pokemon. They are Bug, Dark, Dragon, Electric, Fairy, Fighting, Fire, Flying, Ghost, Grass, Ground, Ice, Normal, Poison, Psychic, Rock, Steel, and Water."

**Expected behavior:** 18 types enumerated. Pokemon stores 1-2 types.

**Actual behavior:**
- **Pokemon model** (`app/prisma/schema.prisma:107-108`): `type1 String`, `type2 String?` -- supports 1 or 2 types.
- **SpeciesData**: `type1`, `type2` seeded from pokedex files.
- **Serialization** (`app/server/utils/serializers.ts:215`): `types: pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1]`.
- **Type chart** (`app/composables/useTypeChart.ts`): Full 18-type effectiveness matrix.
- The 18 types are not explicitly enumerated as a Prisma enum but are stored as strings matching the PTU list. The type chart composable validates all 18 types.

**Classification:** Correct

---

## Item 20: R061 -- Size Classes (C002, C076)

**Rule:** PTU species entries define size classes for each species.

**Expected behavior:** Size classes present: Small, Medium, Large, Huge, Gigantic (and possibly Tiny).

**Actual behavior:**
- **SpeciesData**: `size` field stores the size class string, seeded from pokedex files.
- **Pokemon capabilities JSON**: `capabilities.size` stored via `createPokemonRecord()` at `pokemon-generator.service.ts:249`.
- **Display**: `PokemonCapabilitiesTab` (C076) displays the size.
- **Combat**: `buildPokemonCombatant()` calls `sizeToTokenSize()` from `grid-placement.service.ts` to determine VTT token size from species size.

**Classification:** Correct

---

## Item 21: R062 -- Weight Classes (C002, C076)

**Rule:** PTU species entries define weight classes 1-6 for each species.

**Expected behavior:** Weight class integer stored from SpeciesData.

**Actual behavior:**
- **SpeciesData**: `weightClass` integer field, seeded from pokedex files.
- **Generator** (`pokemon-generator.service.ts:133`): `weightClass = speciesData.weightClass`.
- **Pokemon capabilities JSON**: `capabilities.weightClass` stored via `createPokemonRecord()` at line 248.
- **Display**: `PokemonCapabilitiesTab` (C076) displays weight class.

**Classification:** Correct

---

## Item 22: R063 -- Species Capabilities (C002, C076)

**Rule:** PTU p.200: "Capabilities denote both a Pokemon's basic traits such as how fast they can move or how high they can jump."

**Expected behavior:** Species capabilities populated from pokedex and stored on Pokemon.

**Actual behavior:**
- **SpeciesData**: `capabilities` JSON field, plus individual movement fields (`overland`, `swim`, `sky`, `burrow`, `levitate`, `teleport`, `power`, `jumpHigh`, `jumpLong`), seeded from pokedex files.
- **Generator** (`pokemon-generator.service.ts:120-133`): Reads capabilities, movement caps, jump, power, size, weight class from SpeciesData.
- **createPokemonRecord** (lines 243-250): Stores all capabilities as a JSON object on the Pokemon record.
- **Display**: `PokemonCapabilitiesTab` (C076) displays capabilities.

**Classification:** Correct

---

## Item 23: R065 -- Pokemon Skills (C002, C077)

**Rule:** PTU p.201: "Pokemon have Skills as well [...] the Pokedex document assigns each species a roll value in Athletics, Acrobatics, Combat, Stealth, Perception, and Focus."

**Expected behavior:** 6 core skills stored per Pokemon from species data.

**Actual behavior:**
- **SpeciesData**: `skills` JSON field stores skill dice formulas (e.g., `{ "Athletics": "3d6", "Acrobatics": "2d6", ... }`), seeded from pokedex files.
- **Generator** (`pokemon-generator.service.ts:119`): `skills = JSON.parse(speciesData.skills || '{}')`.
- **Pokemon model** (`schema.prisma:142`): `skills String @default("{}")`.
- **createPokemonRecord** (line 251): `skills: JSON.stringify(data.skills)`.
- **Display**: `PokemonSkillsTab` (C077) displays skills with dice roll support via `usePokemonSheetRolls.rollSkill()`.

**Classification:** Correct

---

## Item 24: R016 -- No Ability Maximum (C012)

**Rule:** "There is no maximum to the number of Abilities that a Pokemon or Trainer may have." (PTU p.200)

**Expected behavior:** Abilities stored as JSON array with no artificial length limit.

**Actual behavior:**
- **Pokemon model** (`schema.prisma:131`): `abilities String @default("[]")` -- JSON array with no length constraint.
- **PUT endpoint** (`app/server/api/pokemon/[id].put.ts:45`): `if (body.abilities !== undefined) updateData.abilities = JSON.stringify(body.abilities)` -- accepts any array size.
- **Generator** returns `abilities: Array<{ name: string; effect: string }>` -- no max check.
- **PokemonLevelUpPanel** (line 136-138): `canAssignAbility()` checks `abilities.length < 2` for second, `< 3` for third -- these are milestone guards, not hard limits. The GM can add more abilities via manual edit.

**Classification:** Correct
