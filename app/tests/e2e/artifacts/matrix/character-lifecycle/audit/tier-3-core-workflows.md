## Tier 3: Core Workflows

### R007 — Background Skill Modification

- **Rule:** "Choose 1 Skill to Adept, 1 to Novice, 3 lowered to Pathetic."
- **Expected behavior:** 11 presets + custom mode, each with 1 Adept, 1 Novice, 3 Pathetic.
- **Actual behavior:** `app/constants/trainerBackgrounds.ts:16-94` — 11 backgrounds with exactly 1 `adeptSkill`, 1 `noviceSkill`, 3 `patheticSkills`. `useCharacterCreation.ts:144-156` applies backgrounds correctly. Custom mode resets to defaults and allows manual setting. Validated by `characterCreationValidation.ts:86-121`.
- **Classification:** Correct

### R051 — Character Creation Workflow

- **Rule:** PTU 9-step creation process.
- **Expected behavior:** Full creation flow covering all relevant steps.
- **Actual behavior:** `useCharacterCreation.ts` covers Steps 2-7 (Background, Edges, Features, Stats, Derived Stats, Biography). Steps 1 (Concept), 8 (Pokemon), and 9 (Items) are handled by other parts of the app. Section completion tracking at lines 293-335 covers: basicInfo, background, edges, classes, stats, biography.
- **Classification:** Correct

### R052 — Steps 3/4 Interleaving

- **Rule:** "You can take Steps 3 and 4 in any order."
- **Expected behavior:** No forced ordering between edges and features.
- **Actual behavior:** Separate sections in the create page, no sequence enforcement. Both `addEdge` and `addFeature` are independently callable.
- **Classification:** Correct

### R025 — Skill Edge Definitions

- **Rule:** "Basic Skills: Rank Up from Pathetic to Untrained, or Untrained to Novice. Adept/Expert/Master Skills unlock at L2/L6/L12."
- **Expected behavior:** Skill edges raise rank by one step, subject to level caps and Pathetic restriction.
- **Actual behavior:** `useCharacterCreation.ts:241-266` — `addSkillEdge` bumps rank one step along `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']`. Blocks Pathetic skills (line 243). Checks cap via `isSkillRankAboveCap` (line 256). `removeEdge` reverts rank (lines 217-233).
- **Classification:** Correct

---
