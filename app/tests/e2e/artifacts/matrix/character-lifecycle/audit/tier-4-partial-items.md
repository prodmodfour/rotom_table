## Tier 4: Partial Items

### R024 — Pathetic Skills Cannot Be Raised At Creation

- **Rule:** "You may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank."
- **Expected behavior:** Pathetic skills from background cannot be raised via Skill Edges during creation.
- **Actual behavior:** `useCharacterCreation.ts:243-244` — `addSkillEdge` blocks if `currentRank === 'Pathetic'`, correctly preventing Skill Edges from raising Pathetic skills. However, `setSkillRank` (line 173-178) in custom background mode has no such restriction. A GM using custom background mode can set Pathetic skills back to higher ranks without going through the Skill Edge path.
- **Classification:** Approximation
- **Severity:** MEDIUM — The primary Skill Edge path enforces the rule. The custom background path does not track which skills were lowered to Pathetic, so it cannot enforce the restriction.

### R033 — Stat Tag Effect

- **Rule:** "[+Stat] Features increase a Stat by one point."
- **Expected behavior:** Features with [+Stat] tags auto-apply stat bonuses.
- **Actual behavior:** Features stored as plain string array (`schema.prisma:38`). No feature metadata parsing. GM must manually adjust stats.
- **Classification:** Approximation
- **Severity:** LOW — Intentional simplification. App stores feature names, not metadata.

### R034 — Ranked Feature Tag

- **Rule:** "[Ranked X] can be taken up to X times."
- **Expected behavior:** Rank tracking for Ranked features.
- **Actual behavior:** Features stored as simple strings. No rank tracking or rank limit validation.
- **Classification:** Approximation
- **Severity:** LOW — GM controls feature entry manually.

### R035 — Branch Feature Tag

- **Rule:** "[Branch] on a [Class] Feature means it may be taken multiple times using a Class slot with different specializations."
- **Expected behavior:** Branching classes can be added multiple times with different specializations.
- **Actual behavior:** `trainerClasses.ts` defines `isBranching: true` on Type Ace, Stat Ace, Style Expert, Researcher, Martial Artist. However, `useCharacterCreation.ts:183` checks `if (form.trainerClasses.includes(className)) return`, which blocks adding the same class name twice. The `isBranching` flag is never consulted during `addClass`. A workaround exists if the user modifies the class name (e.g., "Type Ace: Fire", "Type Ace: Water"), but the catalog selection flow would select "Type Ace" which gets blocked on second selection.
- **Classification:** Incorrect
- **Severity:** MEDIUM — Branching classes like Type Ace should be selectable multiple times per PTU rules. The `isBranching` flag exists but is not used.

### R037 — No Duplicate Features

- **Rule:** "Unless explicitly stated (Ranked), you can only take a Feature once."
- **Expected behavior:** Duplicate detection for non-ranked features.
- **Actual behavior:** `addFeature` at `useCharacterCreation.ts:199-201` appends without duplicate checking. Validation does not check for duplicates.
- **Classification:** Approximation
- **Severity:** MEDIUM — GM can accidentally add the same feature twice.

### R042 — AP Refresh Per Scene

- **Rule:** "Action Points are completely regained at the end of each Scene."
- **Expected behavior:** AP auto-restored at scene end.
- **Actual behavior:** `restHealing.ts:240-243` — `calculateSceneEndAp` correctly computes `maxAp - boundAp - drainedAp`. Function exists but no automatic trigger fires at scene boundaries. GM must manually refresh AP.
- **Classification:** Approximation
- **Severity:** LOW — Calculation is correct; only the automation trigger is missing.

### R044 — Level 2 Milestone (Adept Skills)

- **Rule:** "Level 2: Adept Skills unlocked. Gain one Skill Edge (cannot raise to Adept)."
- **Expected behavior:** Skill rank cap to Adept + 1 bonus Skill Edge with restriction.
- **Actual behavior:** `trainerStats.ts:53` — `getMaxSkillRankForLevel(2)` = `'Adept'`. `getExpectedEdgesForLevel(2)` includes `bonusSkillEdges: 1`. Validation info message mentions the restriction (`characterCreationValidation.ts:144`). However, the restriction "cannot raise to Adept with the bonus edge" is not mechanically enforced — all Skill Edges at level 2 CAN raise to Adept.
- **Classification:** Correct — The rank unlock and edge count are correct. The per-edge restriction is informational per the app's design philosophy (soft warnings, GM decides). The bonus skill edge IS correctly counted in the edge budget.

### R046 — Level 6 Milestone (Expert Skills)

- **Rule:** "Level 6: Expert Skills unlocked. Gain one Skill Edge (cannot raise to Expert)."
- **Expected behavior:** Expert rank unlocked + 1 bonus Skill Edge.
- **Actual behavior:** `trainerStats.ts:52` — `getMaxSkillRankForLevel(6)` = `'Expert'`. `getExpectedEdgesForLevel(6)` includes cumulative `bonusSkillEdges: 2`. Same informational approach as R044.
- **Classification:** Correct — Same reasoning as R044.

### R048 — Level 12 Milestone (Master Skills)

- **Rule:** "Level 12: Master Skills unlocked. Gain one Skill Edge."
- **Expected behavior:** Master rank unlocked + 1 bonus Skill Edge.
- **Actual behavior:** `trainerStats.ts:51` — `getMaxSkillRankForLevel(12)` = `'Master'`. `getExpectedEdgesForLevel(12)` includes `bonusSkillEdges: 3`.
- **Classification:** Correct

---
