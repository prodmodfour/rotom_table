---
review_id: rules-review-065
ticket_ids:
  - ptu-rule-042
  - ptu-rule-043
  - ptu-rule-047
mechanics_verified:
  - trainer-derived-stats-power
  - trainer-derived-stats-high-jump
  - trainer-derived-stats-long-jump
  - trainer-derived-stats-overland
  - trainer-derived-stats-swimming
  - trainer-derived-stats-throwing-range
  - trainer-derived-stats-weight-class
  - pokemon-level-up-stat-points
  - pokemon-level-up-learnset-moves
  - pokemon-level-up-ability-milestones
  - pokemon-level-up-tutor-points
  - faint-condition-clearing
  - encounter-end-volatile-clearing
verdict: PASS
issues_found: 1
severity: LOW
date: 2026-02-20
commits_reviewed:
  - 158fc05
  - bae0a39
  - b412f9d
  - 16de443
  - 43653a1
  - 9425386
  - efff652
---

# Rules Review 065 — P2 Trainer Stats, Level-Up, Condition Clearing

## Scope

Three P2 tickets implementing PTU 1.05 mechanics:

1. **ptu-rule-042** — 7 derived trainer capabilities (Power, High Jump, Long Jump, Overland, Swimming, Throwing Range, Weight Class)
2. **ptu-rule-043** — Pokemon level-up notification system (stat points, learnset moves, ability milestones, tutor points)
3. **ptu-rule-047** — Condition clearing on faint (Persistent+Volatile only) and encounter end (Volatile only)

## Files Reviewed

| File | Ticket |
|------|--------|
| `app/utils/trainerDerivedStats.ts` | ptu-rule-042 |
| `app/pages/gm/characters/[id].vue` | ptu-rule-042 |
| `app/components/character/tabs/HumanStatsTab.vue` | ptu-rule-042 |
| `app/utils/levelUpCheck.ts` | ptu-rule-043 |
| `app/server/api/pokemon/[id]/level-up-check.post.ts` | ptu-rule-043 |
| `app/pages/gm/pokemon/[id].vue` | ptu-rule-043 |
| `app/constants/statusConditions.ts` | ptu-rule-047 |
| `app/server/services/combatant.service.ts` | ptu-rule-047 |
| `app/server/api/encounters/[id]/end.post.ts` | ptu-rule-047 |

## PTU References Used

| Mechanic | Source | Pages |
|----------|--------|-------|
| Trainer capabilities | `core/02-character-creation.md` | pp. 15-17 (lines 290-368, 475-495) |
| Skill rank values | `core/03-skills-edges-and-features.md` | p. 34 (lines 39-61) |
| Pokemon level-up | `core/05-pokemon.md` | pp. 201-202 (lines 555-600) |
| Abilities at Lv20/40 | `core/05-pokemon.md` | p. 200 (lines 406-413) |
| Tutor points | `core/05-pokemon.md` | p. 202 (lines 576-584) |
| Persistent afflictions | `core/07-combat.md` | p. 246 (lines 1528-1570) |
| Volatile afflictions | `core/07-combat.md` | p. 247 (lines 1577-1645) |
| Other afflictions | `core/07-combat.md` | p. 248 (lines 1675-1735) |
| Faint condition clearing | `core/07-combat.md` | p. 248 (lines 1680-1692) |
| Take a Breather | `core/07-combat.md` | p. 245 (lines 1450-1464) |

---

## Ticket: ptu-rule-042 — Trainer Derived Stats

### Skill Rank Mapping

PTU Core p.34 defines: Pathetic=1, Untrained=2, Novice=3, Adept=4, Expert=5, Master=6.

Code (`trainerDerivedStats.ts` lines 37-44):
```typescript
const SKILL_RANK_VALUES: Record<SkillRank, number> = {
  Pathetic: 1, Untrained: 2, Novice: 3, Adept: 4, Expert: 5, Master: 6
}
```

**Verdict: CORRECT** — exact match with PTU rank table.

### Power Formula

PTU Core p.16: "Power starts at 4. If Athletics is at least Novice, raise Power by +1. If Combat is at least Adept, raise Power by +1."

Code (lines 82-88):
```typescript
let power = 4
if (athleticsRank >= SKILL_RANK_VALUES.Novice) { power += 1 }
if (combatRank >= SKILL_RANK_VALUES.Adept) { power += 1 }
```

Verification with Lisa example (Athletics Adept=4, Combat Untrained=2): 4 + 1 + 0 = 5. Book says Power 5.

**Verdict: CORRECT**

### High Jump Formula

PTU Core p.16: "High Jump starts at 0. If Acrobatics is at least Adept, raise High Jump by +1. If Acrobatics is Master, raise High Jump by an additional +1."

Code (lines 91-97):
```typescript
let highJump = 0
if (acrobaticsRank >= SKILL_RANK_VALUES.Adept) { highJump += 1 }
if (acrobaticsRank >= SKILL_RANK_VALUES.Master) { highJump += 1 }
```

Verification with Lisa (Acrobatics Novice=3): 0 + 0 + 0 = 0. Book says High Jump 0.

Edge cases:
- Adept (4): 0 + 1 = 1
- Expert (5): 0 + 1 = 1 (Expert >= Adept but < Master)
- Master (6): 0 + 1 + 1 = 2

Note: Running start bonus (+1) is not included — this is a situational modifier, not a base capability. The code computes base capabilities correctly. The running start is a combat/movement context modifier that would be applied at usage time, not in the stat derivation.

**Verdict: CORRECT**

### Long Jump Formula

PTU Core p.16: "Long Jump is equal to Acrobatics/2." (Quick-Start, line 488: "Long Jump is equal to Acrobtics/2.")

Code (line 100): `const longJump = Math.floor(acrobaticsRank / 2)`

Verification with Lisa (Acrobatics Novice=3): floor(3/2) = 1. Book says Long Jump 1.

Edge cases:
- Pathetic (1): floor(1/2) = 0
- Untrained (2): floor(2/2) = 1
- Master (6): floor(6/2) = 3

**Verdict: CORRECT**

### Overland Formula

PTU Core p.16: "Overland = 3 + [(Athl + Acro)/2]"

Code (line 103): `const overland = 3 + Math.floor((athleticsRank + acrobaticsRank) / 2)`

Verification with Lisa (Athletics Adept=4, Acrobatics Novice=3): 3 + floor((4+3)/2) = 3 + 3 = 6. Book says Overland 6.

Default case (both Untrained=2): 3 + floor(4/2) = 3 + 2 = 5. Book says "By default, this value is 5." Matches.

**Verdict: CORRECT**

### Swimming Formula

PTU Core p.16: "Swimming Speed for a Trainer is equal to half of their Overland Speed."

Code (line 106): `const swimming = Math.floor(overland / 2)`

Verification with Lisa (Overland 6): floor(6/2) = 3. Book says Swim 3.

**Verdict: CORRECT**

### Throwing Range Formula

PTU Core p.16: "Throwing Range is 4 + Athletics Rank."

Code (line 109): `const throwingRange = 4 + athleticsRank`

Verification with Lisa (Athletics Adept=4): 4 + 4 = 8. Book says Throwing Range 8.

**Verdict: CORRECT**

### Weight Class Formula

PTU Core p.16: "A Trainer between 55 and 110 pounds is Weight Class 3. Between 111 and 220 is WC 4. Higher than that is WC 5."

Code (lines 64-68):
```typescript
if (weightLbs > 220) return 5
if (weightLbs >= 111) return 4
return 3
```

Verification with Lisa (120 lbs): 120 >= 111 -> WC 4. Book says WC 4.

Edge cases:
- 55 lbs: WC 3 (correct)
- 110 lbs: WC 3 (correct)
- 111 lbs: WC 4 (correct)
- 220 lbs: WC 4 (correct — "Between 111 and 220")
- 221 lbs: WC 5 (correct)
- 54 lbs: WC 3 (book doesn't specify <55, default to 3 is reasonable)

Note: Weight stored in kg, conversion uses 2.20462 factor (standard kg-to-lbs).

**Verdict: CORRECT**

### ptu-rule-042 Overall Verdict: PASS

All 7 derived stats match PTU Core Chapter 2 formulas exactly. The Lisa worked example (Power 5, High Jump 0, Long Jump 1, Overland 6, Swim 3, Throwing Range 8, WC 4) is fully reproduced by the code.

---

## Ticket: ptu-rule-043 — Pokemon Level-Up Checker

### Stat Points (+1 per level)

PTU Core p.201: "First, it gains +1 Stat Point."

Code (`levelUpCheck.ts` line 80): `statPointsGained: 1` (hardcoded per level)
Summary (line 101): `const totalStatPoints = infos.length` (1 per level gained)

**Verdict: CORRECT**

### Learnset Move Availability

PTU Core p.201: "Check its Pokedex Entry to see if [it learns a Move]."

Code (lines 60-62):
```typescript
const newMoves = learnset
  .filter(entry => entry.level === level)
  .map(entry => entry.move)
```

Filters by exact level match. The API (level-up-check.post.ts) fetches learnset from SpeciesData, parses JSON, and passes it to the pure function.

**Verdict: CORRECT** — checks each level between old and new for matching learnset entries.

### Ability Milestones (Level 20 / Level 40)

PTU Core p.200 (lines 411-413): "At Level 20, a Pokemon gains a Second Ability... At Level 40, a Pokemon gains a Third Ability."

Code (lines 67-73):
```typescript
if (level === 20) {
  abilityMilestone = 'second'
  abilityMessage = 'This Pokemon can now gain a Second Ability (Basic or Advanced).'
} else if (level === 40) {
  abilityMilestone = 'third'
  abilityMessage = 'This Pokemon can now gain a Third Ability (any category).'
}
```

**Verdict: CORRECT** — exact level match for both milestones.

### Tutor Points (Level 5 + every 5 levels)

PTU Core p.202: "Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point."

Code (line 76): `const tutorPointGained = level >= 5 && level % 5 === 0`

Verification:
- Level 5: true (5 >= 5 && 5 % 5 === 0)
- Level 10: true
- Level 4: false (4 < 5)
- Level 7: false (7 % 5 !== 0)

**Verdict: CORRECT**

### Evolution Detection

The ticket notes this is deferred — SpeciesData doesn't store evolution level triggers (evolution conditions are varied: level, item, trade, friendship, etc.). The UI shows a generic reminder: "Check the Pokedex entry for possible evolution at this level."

**Verdict: ACCEPTABLE** — appropriate deferral with user-facing reminder. Evolution conditions are too varied to automate without a dedicated evolution data model.

### Level Cap

Code (line 58): `for (let level = oldLevel + 1; level <= Math.min(newLevel, 100); level++)`

PTU Core p.201: "Pokemon have a maximum Level of 100."

API validation (line 23): `targetLevel < 1 || targetLevel > 100` rejects invalid levels.

**Verdict: CORRECT**

### ptu-rule-043 Overall Verdict: PASS

All implemented items (5 of 7) match PTU rules exactly. The 2 deferred items (evolution detection and stat recalculation) are correctly identified as requiring deeper infrastructure and are appropriately noted in the ticket.

---

## Ticket: ptu-rule-047 — Condition Clearing

### Status Condition Classification

Code (`statusConditions.ts`):

| Category | Code | PTU Rulebook (p.246-248) |
|----------|------|--------------------------|
| Persistent | Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned | Burned, Frozen, Paralysis, Poisoned (Badly Poisoned is a variant of Poisoned) |
| Volatile | Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed | Sleep, Confused, Flinch, Infatuation, Cursed, Disabled, Rage, Sleep, Suppressed, (Bad Sleep, Temp HP) |
| Other | Fainted, Stuck, Slowed, Trapped, Tripped, Vulnerable | Fainted, Blindness, Total Blindness, Slowed, Stuck, Trapped, Tripped, Vulnerable |

Notes on naming differences:
- "Asleep" (code) = "Sleep" (rulebook) — acceptable display name
- "Flinched" (code) = "Flinch" (rulebook) — acceptable display name
- "Enraged" (code) = "Rage" (rulebook) — acceptable; rulebook uses "enraged" in description text

**Verdict: CORRECT** — all conditions are classified in the correct category.

### Minor Gap: Missing Volatile Conditions

Two volatile conditions from the rulebook are absent from `VOLATILE_CONDITIONS`:

1. **Bad Sleep** — not in `StatusCondition` type at all. However, per PTU p.247: "Bad Sleep may only afflict Sleeping targets; if the target is cured of Sleep, they are also cured of Bad Sleep." Since clearing Asleep implicitly clears Bad Sleep, this omission has no functional impact on condition clearing logic.

2. **Temporary Hit Points** — listed under Volatile Afflictions in PTU but handled as a numeric field (`entity.temporaryHp`), not a status string. This is architecturally appropriate — temp HP is a numeric value, not a boolean condition.

Two "Other" conditions from the rulebook are absent:

3. **Blindness** / **Total Blindness** — not in `StatusCondition` type. These are situational conditions rarely used in standard play. Not relevant to the faint/encounter-end clearing logic since they are "Other" conditions anyway.

**Severity: LOW** — no functional impact on the implemented mechanics. The Bad Sleep gap could theoretically matter if a combatant somehow had Bad Sleep tracked as a separate condition, but the type system prevents this.

### Faint Condition Clearing

PTU Core p.248: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."

PTU Core p.248: "Other Afflictions... do not count as true 'Status Afflictions'. Moves, items, features, and other effects that heal Status Afflictions cannot fix these effects."

Code (`combatant.service.ts` lines 153-162):
```typescript
if (damageResult.fainted) {
  const conditionsToClear = [...PERSISTENT_CONDITIONS, ...VOLATILE_CONDITIONS]
  const survivingConditions = (entity.statusConditions || []).filter(
    (s) => !conditionsToClear.includes(s)
  )
  entity.statusConditions = ['Fainted', ...survivingConditions]
}
```

Verification:
- Persistent conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned): CLEARED
- Volatile conditions (Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed): CLEARED
- Other conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable): PRESERVED
- Fainted condition: ADDED

Faint trigger (`fainted = newHp === 0`): HP is clamped to `Math.max(0, unclampedHp)` so `=== 0` catches all cases where actual HP would be 0 or below. Matches PTU: "at 0 Hit Points or lower."

**Verdict: CORRECT**

### Encounter-End Volatile Clearing

PTU Core p.247: "Volatile Afflictions are cured completely at the end of the encounter."

Code (`end.post.ts` lines 17-21, 48-63):
```typescript
function clearVolatileConditions(conditions: StatusCondition[]): StatusCondition[] {
  return conditions.filter(
    (s) => !VOLATILE_CONDITIONS.includes(s)
  )
}

// Applied to ALL combatants in the encounter
const updatedCombatants = combatants.map(combatant => {
  const currentConditions = combatant.entity?.statusConditions || []
  const clearedConditions = clearVolatileConditions(currentConditions)
  // ... immutable update if changed
})
```

Verification:
- All volatile conditions are filtered out from every combatant
- Persistent conditions (Burned, etc.) are preserved (correct — they persist after encounter)
- Other conditions (Stuck, etc.) are preserved
- Fainted condition is preserved (it's an "Other" condition)
- Updated combatants are saved to encounter record AND synced to entity database records
- Optimization: only creates new objects when conditions actually changed (line 53)

**Verdict: CORRECT**

### Cross-Reference: Breather Endpoint

The breather endpoint (`breather.post.ts`) was verified as pre-existing and already correct:
- Clears volatile conditions (except Cursed, per PTU p.245 caveat about curse source distance)
- Also clears Slowed and Stuck (per PTU: "cured of all Volatile Status effects and the Slow and Stuck conditions")

No changes needed. **CONFIRMED CORRECT.**

### ptu-rule-047 Overall Verdict: PASS

Both issues fixed correctly. Faint now properly preserves Other conditions while clearing Persistent and Volatile. Encounter end now properly clears all Volatile conditions from all combatants with database sync.

---

## Summary

| Ticket | Mechanics Verified | Verdict | Issues |
|--------|-------------------|---------|--------|
| ptu-rule-042 | 7/7 trainer capabilities | PASS | None |
| ptu-rule-043 | 5/5 implemented items (2 deferred with justification) | PASS | None |
| ptu-rule-047 | 2/2 condition clearing fixes | PASS | 1 LOW (missing Bad Sleep in type) |

### Issues Found

| # | Severity | Ticket | Description |
|---|----------|--------|-------------|
| 1 | LOW | ptu-rule-047 | `Bad Sleep` is not in the `StatusCondition` type or `VOLATILE_CONDITIONS` list. No functional impact since clearing `Asleep` implicitly clears Bad Sleep per PTU rules, and the type system prevents Bad Sleep from being tracked independently. If Bad Sleep is ever needed as a trackable condition (e.g., for UI display of the "lose 2 ticks on save check" mechanic), it would need to be added to both `StatusCondition` and `VOLATILE_CONDITIONS`. |

### Overall Verdict: PASS

All three tickets implement PTU 1.05 rules correctly. The trainer derived stats utility reproduces the Lisa worked example exactly. The level-up checker matches all Chapter 5 formulas. The condition clearing fixes align precisely with the p.247-248 rules for faint and encounter end. The single LOW issue (missing Bad Sleep type) has no functional impact on any implemented mechanic.
