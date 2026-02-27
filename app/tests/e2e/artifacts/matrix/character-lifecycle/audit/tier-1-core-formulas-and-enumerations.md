## Tier 1: Core Formulas and Enumerations

### R001 — Trainer Combat Stats Definition

- **Rule:** "The 6 combat stats are HP, Attack, Defense, Special Attack, Special Defense, and Speed."
- **Expected behavior:** Model stores all 6 stats.
- **Actual behavior:** Prisma model `HumanCharacter` has `hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed` fields (`app/prisma/schema.prisma:25-30`). `trainerStats.ts` defines `BASE_HP=10`, `BASE_OTHER=5`. `useCharacterCreation.ts:103-110` computes all 6 stats.
- **Classification:** Correct

### R003 — Skill Categories

- **Rule:** "Body: Acrobatics, Athletics, Combat, Intimidate, Stealth, Survival. Mind: General Education, Medicine Education, Occult Education, Pokemon Education, Technology Education, Guile, Perception. Spirit: Charm, Command, Focus, Intuition."
- **Expected behavior:** 17 skills across 3 categories: Body(6), Mind(7), Spirit(4).
- **Actual behavior:** `app/constants/trainerSkills.ts:4-8` defines `PTU_SKILL_CATEGORIES` with Body(6), Mind(7), Spirit(4) = 17 total. Skill names use abbreviated forms (`General Ed`, `Medicine Ed`, etc.) but map correctly to PTU skills.
- **Classification:** Correct

### R004 — Skill Ranks and Dice

- **Rule:** Pathetic=1d6, Untrained=2d6, Novice=3d6, Adept=4d6, Expert=5d6, Master=6d6.
- **Expected behavior:** 6 ranks with matching dice values.
- **Actual behavior:** `app/constants/trainerSkills.ts:19-26` defines `SKILL_RANKS` with exactly these 6 ranks and dice: `{rank:'Pathetic', value:1, dice:'1d6'}` through `{rank:'Master', value:6, dice:'6d6'}`.
- **Classification:** Correct

### R008 — Trainer HP Formula

- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10"
- **Expected behavior:** maxHp = level * 2 + hpStat * 3 + 10, where hpStat is the TOTAL HP stat (base 10 + allocated points).
- **Actual behavior:** `useCharacterCreation.ts:113-115` computes `form.level * 2 + computedStats.value.hp * 3 + 10` where `computedStats.hp = BASE_HP(10) + form.statPoints.hp`. At level 1 with 0 HP points, computedStats.hp = 10, so maxHp = 2 + 30 + 10 = 42. Server-side: `app/server/api/characters/index.post.ts:13` computes `level * 2 + hpStat * 3 + 10` where hpStat is the total stat value. Both match PTU.
- **Classification:** Correct

### R009 — Physical Evasion Formula

- **Rule:** "for every 5 points in Defense, +1 Physical Evasion, up to +6 at 30 Defense."
- **Expected behavior:** floor(Defense/5), capped at +6.
- **Actual behavior:** `useCharacterCreation.ts:119` — `Math.min(6, Math.floor(computedStats.value.defense / 5))`.
- **Classification:** Correct

### R010 — Special Evasion Formula

- **Rule:** "for every 5 points in Special Defense, +1 Special Evasion, up to +6."
- **Expected behavior:** floor(SpDef/5), capped at +6.
- **Actual behavior:** `useCharacterCreation.ts:120` — `Math.min(6, Math.floor(computedStats.value.specialDefense / 5))`.
- **Classification:** Correct

### R011 — Speed Evasion Formula

- **Rule:** "for every 5 points in Speed, +1 Speed Evasion, up to +6."
- **Expected behavior:** floor(Speed/5), capped at +6.
- **Actual behavior:** `useCharacterCreation.ts:121` — `Math.min(6, Math.floor(computedStats.value.speed / 5))`.
- **Classification:** Correct

### R012 — Evasion General Formula

- **Rule:** "divide the related Combat Stat by 5 and round down. Never more than +6 from Combat Stats alone."
- **Expected behavior:** floor division with +6 cap, consistently applied.
- **Actual behavior:** All three evasions (R009-R011) use `Math.floor` for division and `Math.min(6, ...)` for cap.
- **Classification:** Correct

### R041 — Action Points Pool

- **Rule:** "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels; a Level 15 Trainer would have 8 Action Points."
- **Expected behavior:** maxAP = 5 + floor(level/5). L1=5, L5=6, L10=7, L15=8.
- **Actual behavior:** `app/utils/restHealing.ts:219-221` — `return 5 + Math.floor(level / 5)`. L1=5, L5=6, L15=8. Matches PTU example.
- **Classification:** Correct

### R068 — Percentages Are Additive

- **Rule:** "Percentages are additive, not multiplicative."
- **Expected behavior:** Combined bonuses use addition.
- **Actual behavior:** `app/utils/equipmentBonuses.ts:42-45` uses additive accumulation: `damageReduction += item.damageReduction`. No multiplicative percentage compounding found anywhere.
- **Classification:** Correct

---
