---
design_id: design-stat-feature-tags-026
ticket_id: feature-026
category: FEATURE_GAP
scope: FULL
domain: character-lifecycle
status: complete
decree: decree-051
affected_files:
  - app/server/api/characters/index.post.ts
  - app/server/api/characters/[id].put.ts
  - app/composables/useCharacterCreation.ts
  - app/composables/useTrainerLevelUp.ts
  - app/components/player/PlayerCharacterSheet.vue
  - app/components/character/CharacterModal.vue
  - app/pages/gm/characters/[id].vue
  - app/types/character.ts
new_files:
  - app/utils/featureStatParser.ts
  - app/tests/unit/utils/featureStatParser.test.ts
---


# Design: Auto-parse [+Stat] Feature Tags and Apply Stat Bonuses

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Pure parser utility, B. Stat calculation integration, C. Server-side stat recalculation on feature change | [spec-p0.md](spec-p0.md) |
| P1 | D. UI stat bonus source breakdown in character sheets, E. Bonus indicators in creation/level-up flows | [spec-p1.md](spec-p1.md) |

## Summary

PTU features include `[+Stat]` tags (e.g., `[+Attack]`, `[+HP]`, `[+Special Defense]`) that grant +1 to a trainer stat per tag. Currently, features are stored as plain strings in the database and the app does not detect or apply these stat bonuses. The GM must manually adjust stats, which is error-prone and violates the automation principle established by decree-051.

This design adds:
1. A pure parser utility that extracts stat bonuses from feature names/tags
2. Integration into stat calculation so that stats sent to/from the API include feature bonuses
3. UI display showing where stat bonuses come from (base allocation vs feature tags)

### PTU Rules (Core Chapter 2, p. 15; Chapter 3, p. 58)

Per PTU 1.05:
- Features with `[+Stat]` tags "increase a Stat by one point" (p. 58)
- Each tag instance grants exactly +1 to the named stat
- These bonuses stack across multiple features (e.g., Athlete [+HP] + Training Regime [+HP] = +2 HP)
- The example on p. 15 shows Lisa's trainer with "two [+HP] tags" adding to her final HP stat
- `[+Any Stat]` features (Fighter's Versatility, Signature Move, Type Expertise) let the player choose which stat receives the +1

### Applicable Decrees

- **decree-051** (PRIMARY): Auto-parse `[+Stat]` tags and apply stat bonuses automatically. Automation of routine bookkeeping is preferred.
- **decree-052** (RELATED): Edges will become structured objects. Feature-stat parsing is independent of edge storage, but both contribute to the "automate mechanical effects" pattern.
- **decree-037** (CONTEXT): Skill ranks come from Edge slots only. Establishes the pattern that mechanical effects should flow from data, not manual tracking.

### Matrix Rules Covered

| Rule | Title | Tier |
|------|-------|------|
| NEW | [+Stat] tags parsed and applied automatically | P0 |
| NEW | Stat bonus sources visible in character sheet | P1 |

---

## Current State Analysis

### What Exists

| Component | Feature Handling | Stat Bonus Handling |
|-----------|-----------------|---------------------|
| `HumanCharacter.features` | `string[]` — plain feature names | **None** — stats stored as raw numbers |
| `useCharacterCreation.ts` | `addFeature(name)` adds string | No [+Stat] parsing |
| `useTrainerLevelUp.ts` | `addFeature(name)` adds string | No [+Stat] parsing |
| `characters/index.post.ts` | Stores features as JSON, stats as separate columns | No relationship between features and stats |
| `characters/[id].put.ts` | Updates features and stats independently | No recalculation when features change |
| `PlayerCharacterSheet.vue` | Displays stats and features in separate sections | No stat-source breakdown |
| `CharacterModal.vue` | Edits features and stats independently | No automatic stat adjustment |
| `trainerStats.ts` | `computedStats = BASE + statPoints` | No feature bonus term |

### What is Missing

- Parser for `[+Stat]` patterns in feature text
- Integration of parsed bonuses into stat calculations
- `[+Any Stat]` choice tracking (user must choose which stat)
- Stat bonus source breakdown in the UI
- Recalculation when features are added/removed (creation, level-up, manual edit)
- Fallback mapping for features whose names don't contain explicit tags

### DB Schema Status

**No schema changes needed.** Stats are stored as computed values (already include all bonuses when saved). The parser runs at display-time and during stat calculation. Features remain stored as `string[]`. The `[+Any Stat]` choice is encoded in the feature string itself (e.g., "Fighter's Versatility [+Speed]").

---

## Priority Map

| # | Feature | What it Does | Priority |
|---|---------|-------------|----------|
| A | Feature stat parser utility | Pure function: parse [+Stat] tags from feature strings, return stat bonuses | **P0** |
| B | Stat calculation integration | Wire parser into stat computation in creation, level-up, and display | **P0** |
| C | Server/API stat recalculation | Recalculate stats including feature bonuses when saving characters | **P0** |
| D | Stat bonus source UI | Show breakdown (base + allocated + feature bonuses) in character sheets | **P1** |
| E | Creation/level-up bonus indicators | Show parsed bonuses in real-time during feature selection | **P1** |

---

## Dependencies

| Dependency | Status | Impact |
|-----------|--------|--------|
| `trainerStats.ts` constants | Exists | Used for base stat values |
| `useCharacterCreation.ts` | Exists | Integration point for P0-B |
| `useTrainerLevelUp.ts` | Exists | Integration point for P0-B |
| `characters/[id].put.ts` | Exists | Integration point for P0-C |
| `characters/index.post.ts` | Exists | Integration point for P0-C |
| `PlayerCharacterSheet.vue` | Exists | Integration point for P1-D |
| decree-052 (structured edges) | Separate ticket (feature-027) | No blocking dependency. Edge metadata is independent of feature [+Stat] parsing |

---

## Atomized Files

- [_index.md](_index.md)
- [shared-specs.md](shared-specs.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [testing-strategy.md](testing-strategy.md)

---

## Out of Scope

- **Feature prerequisite enforcement:** The parser detects [+Stat] tags but does not validate whether the trainer qualifies for the feature.
- **Full feature database:** Features are free-text strings. The parser works on the raw text, not a structured feature catalog.
- **Pokemon feature stat bonuses:** This design covers trainer features only. Pokemon stats are computed differently (base stats + nature + level).
- **Conditional bonuses:** Features with conditional stat effects (e.g., "gain +1 Attack while X") are not auto-applied. Only unconditional [+Stat] tags are parsed.
- **Edge stat bonuses:** Edges are a separate data model (string[] or future structured objects per decree-052). This design handles features only.
- **Martial Artist branch-conditional tags:** Martial Artist class features map ability choices (Guts, Iron Fist, etc.) to stat tags. The parser handles these via the FEATURE_STAT_MAP fallback.

---

## Implementation Order

1. **P0 (parser + stat integration)**
   - `app/utils/featureStatParser.ts` — pure parser utility
   - `app/tests/unit/utils/featureStatParser.test.ts` — parser unit tests
   - `app/composables/useCharacterCreation.ts` — wire parser into `computedStats`
   - `app/composables/useTrainerLevelUp.ts` — wire parser into effective stats preview
   - `app/server/api/characters/index.post.ts` — recalculate stats on create
   - `app/server/api/characters/[id].put.ts` — recalculate stats on update

2. **P1 (UI stat source display)**
   - `app/components/player/PlayerCharacterSheet.vue` — stat source breakdown tooltip
   - `app/components/character/CharacterModal.vue` — stat source breakdown in edit view
   - `app/composables/useCharacterCreation.ts` — live bonus preview in creation
   - `app/composables/useTrainerLevelUp.ts` — live bonus preview in level-up
