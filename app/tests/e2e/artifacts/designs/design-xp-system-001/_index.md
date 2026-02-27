---
design_id: design-xp-system-001
ticket_id: ptu-rule-055
category: FEATURE_GAP
scope: FULL
domain: pokemon-lifecycle
status: implemented
affected_files:
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/services/encounter.service.ts
  - app/stores/encounter.ts
  - app/types/encounter.ts
  - app/prisma/schema.prisma
new_files:
  - app/utils/experienceCalculation.ts
  - app/server/api/encounters/[id]/xp-calculate.post.ts
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/pokemon/[id]/add-experience.post.ts
  - app/components/encounter/XpDistributionModal.vue
  - app/components/encounter/LevelUpNotification.vue
---


# Design: Post-Combat XP Calculation & Distribution System

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. XP Calculation Utility (P0), B. XP Calculation API Endpoint (P0), C. XP Distribution API Endpoint (P0) | [spec-p0.md](spec-p0.md) |
| P1 | D. XP Distribution UI -- Post-Encounter Modal (P1) | [spec-p1.md](spec-p1.md) |
| P2 | E. Level-Up Detection & Notification (P2) | [spec-p2.md](spec-p2.md) |

## Summary

Implement the full PTU 1.05 experience system: calculate XP from defeated enemies after combat, present a distribution UI for GM approval, apply XP to participating Pokemon, and detect level-ups with stat point prompts. Currently, the `defeatedEnemies` array is tracked during combat but never consumed -- the GM manually updates experience values on individual Pokemon sheets.

The `captureRate.ts` pure-utility pattern is the architectural reference: a pure calculation function with typed input/output and full breakdown, consumed by a thin API endpoint.

---

## PTU Rules Reference

### Pokemon Experience (PTU Core p.460)

**Step 1 -- Base Experience Value:**
Total the levels of all defeated enemy combatants. For enemy Trainers who participated directly in combat, treat their level as **doubled**.

*Example: A Level 10 Trainer with a Level 20 Pokemon = 20 + 20 = 40 Base XP.*

**Step 2 -- Significance Multiplier (x1 to x5+):**
GM-assigned multiplier based on narrative significance and challenge level.
- Insignificant (wild Pidgeys): x1 to x1.5
- Average encounters: x2 to x3
- Significant (gym leader, rival): x4 to x5+

Adjust by +/- x0.5 to x1.5 based on difficulty relative to party strength.

**Step 3 -- Division by Players:**
Divide total XP by the number of **players** (not Pokemon). Each player then splits their share among the Pokemon they used.

### XP Regulation Rules (PTU Core p.460)
- XP can only go to Pokemon who **participated** in the encounter (as written).
- **Fainted Pokemon CAN receive XP** (unlike video games).
- GM may optionally allow non-participant Pokemon to receive a portion (boss encounters, timeskips).
- GM may cap XP per Pokemon to prevent one Pokemon from outstripping the party average.

### Boss Encounter XP (PTU Core p.489)
Boss enemy XP is **not divided** by number of players -- each player receives the full Boss XP.

### Pokemon Experience Chart (PTU Core p.203)
Level-to-XP-needed table from Level 1 (0 XP) to Level 100 (20,555 XP). Each level has a cumulative "Exp Needed" threshold.

### Level-Up Effects (PTU Core p.202)
When a Pokemon levels up:
1. Gains **+1 Stat Point** (must follow Base Relations Rule)
2. May learn new **Moves** from its learnset at the new level
3. May **Evolve** (if evolution conditions are met at this level)
4. At Level 20: gains **Second Ability** (Basic or Advanced)
5. At Level 40: gains **Third Ability** (any)
6. At levels divisible by 5: gains **+1 Tutor Point**

### Trainer Experience (PTU Core p.461)
Trainers level via **Milestones** (badges, major victories) or an **Experience Bank** (10 XP = +1 Level). Trainer XP is GM-discretionary: 0 for trivial encounters, 1-2 for average, 3-5 for significant. This design focuses on Pokemon XP; Trainer XP is a separate GM action.

### Training Experience (PTU Core p.202)
Daily training grants XP = half Pokemon's level + Command Rank bonus. This is separate from combat XP and already partially modeled by the `trainingExp` field on the Pokemon model.

---

## Priority Map

| # | Mechanic | Current Status | Gap | Priority |
|---|----------|---------------|-----|----------|
| A | XP calculation formula | NOT_IMPLEMENTED | `defeatedEnemies` tracked but never consumed | **P0** |
| B | XP distribution API | NOT_IMPLEMENTED | No endpoint to apply XP to Pokemon | **P0** |
| C | XP distribution UI (post-encounter modal) | NOT_IMPLEMENTED | GM sees no XP summary after combat | **P1** |
| D | Level-up detection & notification | NOT_IMPLEMENTED | No detection when XP crosses threshold | **P2** |
| E | Stat allocation prompt on level-up | NOT_IMPLEMENTED | No UI for +1 stat point assignment | **P2** |
| F | Move/ability/evolution prompts on level-up | NOT_IMPLEMENTED | No automation for level-up side effects | **P2** |

---


## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
- [implementation-log.md](implementation-log.md)
