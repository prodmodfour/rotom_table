---
design_id: design-char-creation-001
ticket_id: ptu-rule-056
category: FEATURE_GAP
scope: FULL
domain: character-lifecycle
status: implemented
affected_files:
  - app/pages/gm/create.vue
  - app/server/api/characters/index.post.ts
  - app/components/character/CharacterModal.vue
  - app/components/character/tabs/HumanClassesTab.vue
  - app/components/character/tabs/HumanSkillsTab.vue
  - app/components/character/tabs/NotesTab.vue
  - app/types/character.ts
  - app/stores/library.ts
new_files:
  - app/constants/trainerSkills.ts
  - app/constants/trainerBackgrounds.ts
  - app/constants/trainerClasses.ts
  - app/components/create/CreateHumanForm.vue
  - app/components/create/StatAllocationSection.vue
  - app/components/create/SkillBackgroundSection.vue
  - app/components/create/ClassFeatureSection.vue
  - app/components/create/EdgeSelectionSection.vue
  - app/components/create/BiographySection.vue
  - app/composables/useCharacterCreation.ts
  - app/utils/characterCreationValidation.ts
---


# Design: Expanded Character Creation Form (PTU Rules-Compliant)

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. PTU Skill Constants and Background Presets (P0), B. Stat Allocation with PTU Constraints (P0), C. Skill Background Selection (P0) | [spec-p0.md](spec-p0.md) |
| P1 | D. Trainer Class Constants (P1), E. Class/Feature/Edge Selection with Basic Validat | [spec-p1.md](spec-p1.md) |
| P2 | F. Biographical Fields Section (P2), G. Quick-Create vs Full-Create Mode Toggle (P2) | [spec-p2.md](spec-p2.md) |

## Summary

The current character creation form (`app/pages/gm/create.vue`) is a minimal stub that only collects name, character type, level, stats (raw numbers), and notes. All PTU character creation steps are missing: background selection, skill allocation, edge/feature selection, class selection, and biographical details. Full character data can only be entered via CSV import or post-creation editing through the character sheet modal.

This design expands the creation form to follow the PTU 1.05 character creation flow (Chapter 2, pp. 12-22) while preserving the existing quick-create path for NPCs. The form targets GM use -- the GM creates characters for both PCs and NPCs.

---

## PTU Character Creation Steps (Reference)

Per PTU 1.05 Chapter 2 (pp. 12-18), character creation follows 9 steps:

1. **Character Concept** -- brief phrase (name, type selection)
2. **Background** -- raises 1 skill to Adept, 1 to Novice, lowers 3 to Pathetic
3. **Choose Edges** -- 4 starting edges (Skill Edges raise skill ranks; specialty edges provide specific bonuses)
4. **Choose Features** -- 4 features + 1 free Training Feature (most come from Trainer Classes)
5. **Assign Combat Stats** -- 10 HP base, 5 each other stat, distribute 10 points (max 5 per stat)
6. **Derived Stats** -- auto-calculated (already implemented in `trainerDerivedStats.ts`)
7. **Basic Descriptions** -- name, appearance, personality, goals, background story
8. **Choose Pokemon** -- handled separately (pokemon creation flow)
9. **Money and Items** -- starting cash + inventory

Steps 2-4 can be done in any order (PTU p. 14: "You can take Steps 3 and 4 in any order").

---

## Current State Analysis

### What Exists

| PTU Step | DB Column | Create Form | Character Sheet (View/Edit) | CSV Import |
|---|---|---|---|---|
| Name/Type | `name`, `characterType` | Yes | Yes | Yes |
| Level | `level` | Yes | Yes | Yes |
| Stats (HP/Atk/Def/SpA/SpD/Spe) | `hp`, `attack`, etc. | Yes (raw numbers) | Yes (read-only) | Yes |
| Max HP | `maxHp` | Auto-calculated | Yes | Yes |
| Trainer Classes | `trainerClasses` (JSON) | **No** | View only (tags) | **No** (parsed from features col) |
| Skills | `skills` (JSON) | **No** | View only (grid) | Yes (17 skills) |
| Features | `features` (JSON) | **No** | View only (tags) | Yes (parsed) |
| Edges | `edges` (JSON) | **No** | View only (tags) | Yes (parsed) |
| Background | `background` | **No** | Edit via Notes tab | Yes |
| Personality | `personality` | **No** | Edit via Notes tab | **No** |
| Goals | `goals` | **No** | Edit via Notes tab | **No** |
| Age/Gender/Height/Weight | All exist | **No** | Age/Gender in header; Height/Weight in Stats tab | Age/Gender from CSV |
| Money | `money` | **No** | Edit via Stats tab | Yes |
| Location | `location` | NPC only | Yes | **No** |

### What is Missing from Create Form

- Skill background selection (or custom skill allocation)
- Edge selection (4 starting edges)
- Feature/Class selection (4 features + 1 Training Feature)
- Stat allocation with PTU constraints (10 HP base, 5 others, +10 to distribute, max 5 per stat)
- Biographical fields (age, gender, height, weight, background text, personality, goals)
- Money input

### DB Schema Status

**No schema changes needed.** All required columns already exist in the `HumanCharacter` model:
- `trainerClasses` (JSON string, default `[]`)
- `skills` (JSON string, default `{}`)
- `features` (JSON string, default `[]`)
- `edges` (JSON string, default `[]`)
- `background`, `personality`, `goals` (nullable strings)
- `age`, `gender`, `height`, `weight` (nullable)
- `money` (int, default 0)

The POST endpoint (`/api/characters/index.post.ts`) already accepts all these fields -- it just passes through whatever the client sends as JSON. The create form simply does not send them.

---

## Priority Map

| # | Feature | What it Does | Priority |
|---|---------|-------------|----------|
| A | PTU skill constants + background presets | Reference data for skills and backgrounds | **P0** |
| B | Stat allocation with PTU constraints | Enforce starting stat rules (10 HP, 5 base, +10 pool, max 5/stat) | **P0** |
| C | Skill background selection | Apply background presets or custom skill allocation | **P0** |
| D | Trainer class constants (name + prerequisites only) | Reference data for class selection UI | **P1** |
| E | Class/Feature selection with prerequisite validation | Select classes (max 4), features (4+1 Training), edges (4) | **P1** |
| F | Biographical fields section | Age, gender, height, weight, personality, goals, background text | **P2** |
| G | Quick-create vs Full-create mode toggle | Preserve current minimal path for NPCs, full path for PCs | **P2** |

---


## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
- [implementation-log.md](implementation-log.md)
