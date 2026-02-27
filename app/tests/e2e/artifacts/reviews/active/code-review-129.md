---
review_id: code-review-129
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-056
domain: character-lifecycle
commits_reviewed:
  - cffaade
  - bdc5530
  - 16de370
  - dd23791
  - 8b23bac
files_reviewed:
  - app/composables/useCharacterCreation.ts
  - app/components/create/BiographySection.vue
  - app/pages/gm/create.vue
  - app/types/character.ts
  - app/constants/trainerStats.ts
  - app/server/api/characters/index.post.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-02-21T22:30:00Z
follows_up: null
---

## Review Scope

P2 implementation of ptu-rule-056: Biography fields, BiographySection.vue, CreateMode type with section completion tracking, and Quick-Create/Full-Create mode toggle. This is the third tier of the character creation improvement feature. P0 (basic form) and P1 (classes/features/edges) were reviewed and approved in code-review-118, code-review-121/121b, and rules-review-111.

5 commits, 5 files changed (+878/-101 lines). Primary code files: composable (398 lines), BiographySection (311 lines), create.vue (862 lines).

## Issues

### CRITICAL

#### C1. `create.vue` exceeds 800-line file size limit (862 lines)

**File:** `app/pages/gm/create.vue` -- 862 lines (421 template, 177 script, 264 style)

The project standard enforces a hard 800-line maximum for any single file. The P1 review (code-review-121) noted create.vue at 536 lines and called it acceptable. P2 added the Quick Create form, mode toggle, section progress bar, and BiographySection wiring, pushing it to 862 lines.

The Quick Create form (lines 63-134, ~72 lines of template) and the Pokemon form (lines 310-418, ~109 lines of template) are standalone sections that could be extracted to their own components. The mode toggle (lines 37-60, ~24 lines) and section progress bar (lines 139-161, ~23 lines) are also candidates.

**Fix:** Extract the Quick Create form into `QuickCreateForm.vue` and/or the Pokemon form into `PokemonCreateForm.vue`. Either extraction alone brings the file under 800 lines. Extracting the Quick Create form (~72 template + ~35 script + ~0 new style) is the smallest-effort fix.

### HIGH

#### H1. `cmToFeetInches()` produces `X'12"` instead of `(X+1)'0"` for certain heights

**File:** `app/components/create/BiographySection.vue` lines 181-186

```typescript
function cmToFeetInches(cm: number): string {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${inches}"`
}
```

When `totalInches % 12` is >= 11.5, `Math.round()` produces 12, displaying invalid output like `5'12"` instead of `6'0"`. Verified cases:

- 182 cm -> 71.65 inches -> mod12 = 11.65 -> rounds to 12 -> displays `5'12"` (should be `6'0"`)
- 152 cm -> 59.84 inches -> mod12 = 11.84 -> rounds to 12 -> displays `4'12"` (should be `5'0"`)
- 30 cm -> 11.81 inches -> mod12 = 11.81 -> rounds to 12 -> displays `0'12"` (should be `1'0"`)

**Fix:**

```typescript
function cmToFeetInches(cm: number): string {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  if (inches === 12) {
    return `${feet + 1}'0"`
  }
  return `${feet}'${inches}"`
}
```

#### H2. `computeWeightClass()` uses Pokemon weight class thresholds, not Trainer weight class thresholds

**File:** `app/components/create/BiographySection.vue` lines 193-206

The code comment says "PTU weight classes (from Pokedex entries)" -- but this is a **Trainer** creation form, not a Pokemon form. PTU defines different weight class scales for Trainers and Pokemon.

**PTU Trainer Weight Classes (Core Chapter 2, p.16):**
- WC 3: 55-110 lbs (24.9-49.9 kg)
- WC 4: 111-220 lbs (50.3-99.8 kg)
- WC 5: 221+ lbs (100.2+ kg)

Trainers only have WC 3, 4, or 5. There is no Trainer WC 1, 2, or 6.

**Current code (Pokemon scale):**
- WC 1: 0-10 kg, WC 2: 10-25 kg, WC 3: 25-50 kg
- WC 4: 50-100 kg, WC 5: 100-200 kg, WC 6: 200+ kg

Divergences at common weights:
- 25 kg (55 lbs): Code shows WC 2, PTU says WC 3
- 50 kg (110 lbs): Code shows WC 3, PTU says WC 3 (happens to match)
- 100 kg (220 lbs): Code shows WC 4, PTU says WC 5

This is a data correctness bug. A Trainer who weighs 100 kg would interact with weight-dependent Moves and Abilities incorrectly if they trust this display.

**Fix:** Replace with Trainer weight class computation using the PTU pound-based thresholds:

```typescript
/**
 * Compute PTU Trainer weight class from kg.
 * PTU Trainer Weight Classes (Core Chapter 2, p. 16):
 * WC 3: 55-110 lbs, WC 4: 111-220 lbs, WC 5: 221+ lbs
 * Trainers below 55 lbs are not defined; default to WC 3.
 */
function computeWeightClass(kg: number): number {
  const lbs = kg * 2.20462
  if (lbs <= 110) return 3
  if (lbs <= 220) return 4
  return 5
}
```

### MEDIUM

#### M1. `parseOptionalInt()` does not enforce positive-only values

**File:** `app/components/create/BiographySection.vue` lines 165-170

```typescript
function parseOptionalInt(event: Event): number | null {
  const value = (event.target as HTMLInputElement).value
  if (!value) return null
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}
```

The HTML inputs for age, height, and weight have `min="1"`, but `min` is only a browser hint -- users can paste or type negative values. `parseInt("-5", 10)` returns `-5` (not NaN), so it passes through. Negative ages, heights, and weights would be stored in the database.

**Fix:** Add a positivity check:

```typescript
function parseOptionalInt(event: Event): number | null {
  const value = (event.target as HTMLInputElement).value
  if (!value) return null
  const parsed = parseInt(value, 10)
  return isNaN(parsed) || parsed < 1 ? null : parsed
}
```

#### M2. `sectionCompletion.background` threshold of `skillsWithRanks >= 5` is a magic number

**File:** `app/composables/useCharacterCreation.ts` line 289

```typescript
complete: hasBackground && skillsWithRanks >= 5,
```

The number 5 corresponds to "1 Adept + 1 Novice + 3 Pathetic = 5 non-Untrained skills from a background preset." But this is a magic number with no explanation and no constant. If Skill Edges modify ranks (raising Untrained -> Novice), the count changes and the completion indicator may show "complete" even without a background.

Also, this threshold is not correct for custom backgrounds where the user picks their own ranks -- a valid custom background could have fewer than 5 non-Untrained skills.

**Fix:** Either extract the constant with a comment explaining the rationale, or simplify the completion check to `hasBackground` alone (since a complete background implies skill allocation). At minimum, add a comment explaining the 5.

#### M3. Quick Create form does not send `money` field

**File:** `app/pages/gm/create.vue` lines 503-536

The Quick Create submission (`createHumanQuick`) builds the payload without a `money` field. The server defaults money to 0 (`body.money || 0`). This means Quick Create characters start with 0 money, while Full Create characters start with 5000 (the PTU default).

For a "minimal NPC scaffolding" mode, 0 money may be intentional (NPCs don't typically need starting funds). However, if a GM uses Quick Create for a PC (the form does offer "Player Character" as a type), the character will have 0 money instead of the PTU-standard 5000.

**Fix:** Either:
- A) Add `money: 5000` to the Quick Create payload (consistent with PTU), or
- B) Add a comment explaining that Quick Create intentionally omits money for minimal scaffolding

Option B is acceptable if the design intent is clear.

## What Looks Good

1. **Component boundaries are clean.** BiographySection is a pure presentational component: all data flows in via props, all changes flow out via typed emits. No direct store access. The parent wires everything explicitly. This is the same solid pattern from P1.

2. **Immutability is maintained throughout.** The composable continues to use spread patterns for all form state mutations. No direct mutation of reactive objects. Biography fields use the same `form.field = value` pattern as existing fields (acceptable since `form` is the top-level reactive object).

3. **The Quick Create / Full Create split is well-designed.** The two modes share no form state (Quick Create has its own `quickForm` ref), which avoids state contamination. The Full Create mode reuses the existing composable entirely. The mode toggle UI is clear and accessible.

4. **Section completion tracking is thoughtfully computed.** Each section has a `label`, `complete` boolean, and `detail` string. The progress bar provides clear visual feedback. The biography section completion is appropriately lenient (any story/personality/goals field counts as complete).

5. **BiographySection.vue file size is excellent at 311 lines.** Well within the 800-line limit. The template/script/style ratio is balanced. Unit conversion helpers are co-located with the component that uses them.

6. **Commit granularity is correct.** 5 commits for 5 logical changes: composable fields -> component -> types -> page integration -> docs. Each commit is focused and produces a working state.

7. **The auto-expand behavior for PC biography is a nice UX touch.** The `watch` on `creation.form.characterType` that toggles `biographyExpanded` based on `'player'` is the right default: PCs need biography, NPCs usually don't.

8. **`parseOptionalInt` and `parseIntOrDefault` handle the null/default pattern correctly.** The distinction between optional fields (age, height, weight -> null when empty) and required-with-default fields (money -> default when empty) is well-modeled.

9. **SCSS follows project patterns.** Glass morphism variables, spacing scale, font sizes, color variables, BEM naming, transitions -- all consistent with existing components.

## Verdict

**CHANGES_REQUIRED**

Three issues must be fixed before this can be approved:

| ID | Severity | Description | Effort |
|---|---|---|---|
| C1 | CRITICAL | `create.vue` at 862 lines exceeds the 800-line limit | Small -- extract Quick Create or Pokemon form to child component |
| H1 | HIGH | `cmToFeetInches()` shows `5'12"` for 182 cm instead of `6'0"` | Trivial -- add `inches === 12` guard |
| H2 | HIGH | `computeWeightClass()` uses Pokemon scale instead of Trainer scale for the Trainer creation form | Small -- replace with PTU Trainer WC thresholds (WC 3/4/5 based on pounds) |

Medium issues should also be addressed in the follow-up:

| ID | Severity | Description | Effort |
|---|---|---|---|
| M1 | MEDIUM | `parseOptionalInt` allows negative ages/heights/weights | Trivial |
| M2 | MEDIUM | Magic number 5 in background section completion | Trivial |
| M3 | MEDIUM | Quick Create PCs start with 0 money instead of PTU default 5000 | Trivial |

## Required Changes

1. Extract Quick Create form or Pokemon form from `create.vue` into a child component to bring the file under 800 lines.
2. Fix the `cmToFeetInches` rounding bug (inches === 12 -> increment feet, reset inches to 0).
3. Replace `computeWeightClass` with the PTU Trainer weight class thresholds (WC 3: <=110 lbs, WC 4: 111-220 lbs, WC 5: 221+ lbs).
4. Add `parsed < 1` guard to `parseOptionalInt`.
5. Add a comment or constant for the `skillsWithRanks >= 5` threshold.
6. Either add `money: 5000` to Quick Create payload or document the intentional omission.
