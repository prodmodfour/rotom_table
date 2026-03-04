---
review_id: code-review-200
review_type: code + rules
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-091
domain: character-lifecycle
commits_reviewed:
  - 69f53a0
  - 572f99f
  - ef9b512
  - 57c0aee
files_reviewed:
  - app/constants/trainerClasses.ts
  - app/composables/useCharacterCreation.ts
  - app/components/create/ClassFeatureSection.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 2
reviewed_at: 2026-02-27T12:45:00Z
follows_up: null
---

## Review Scope

First review of ptu-rule-091: branch class specialization suffix per decree-022. The implementation adds branching class handling so that classes with the `[Branch]` tag can be taken multiple times with different specializations, stored as `"ClassName: Specialization"` per decree-022. Four commits: specialization constants/helpers (trainerClasses.ts), addClass fix (useCharacterCreation.ts), specialization dropdown UI (ClassFeatureSection.vue), and cleanup of unused import.

### Decree Check

**decree-022** (character-lifecycle: branch-class-handling): Implementation follows the decree's approach -- specialization suffix with colon separator, `string[]` data model preserved, prefix matching via `hasBaseClass()`, UI provides specialization selection. The separator format, storage approach, and lookup strategy all match the decree's ruling.

## Issues

### CRITICAL

#### C1: Martial Artist is NOT a `[Branch]` class in PTU

**File:** `app/constants/trainerClasses.ts` (lines 76, 115-117)
**Also:** `BRANCHING_CLASS_SPECIALIZATIONS` map

The PTU rulebook (Core p. 161) lists Martial Artist as `[Class]` only -- there is NO `[Branch]` tag. Compare:

- Type Ace: `[Class] [Branch]` (p. 119)
- Stat Ace: `[Class] [Branch]` (p. 112)
- Style Expert: `[Class] [Branch]` (p. 115)
- Researcher: `[Class][Branch]` (p. 140)
- **Martial Artist: `[Class]`** (p. 161) -- no `[Branch]`

Martial Artist requires choosing an Ability (Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician) when the class is taken, but this is an internal feature choice, not a branching specialization. The class cannot be taken multiple times.

Additionally, the specialization list `['Aura', 'Cover', 'Elemental', 'Focused', 'Form', 'Freestyle', 'Parkour', 'Weapons']` does not correspond to any PTU content. The actual Martial Artist abilities are: Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician.

**Required fix:**
1. Remove `isBranching: true` from the Martial Artist entry in `TRAINER_CLASSES` (line 76) -- this was pre-existing bad data but is now actively used.
2. Remove the `'Martial Artist'` key from `BRANCHING_CLASS_SPECIALIZATIONS`.

Note: The pre-existing `isBranching: true` flag on Martial Artist was dead code before this PR. These commits activate it, making this a correctness regression introduced by this change set.

### HIGH

#### H1: Branching class picker opens when max class slots are full, but confirm silently fails

**File:** `app/components/create/ClassFeatureSection.vue` (lines 282-296, 307-310)
**File:** `app/composables/useCharacterCreation.ts` (line 187)

When a branching class has at least one instance and more specializations are available, `isClassDisabled()` returns `false` even if the character is at 4/4 class slots. Clicking the button opens the specialization picker. The user selects a specialization and clicks Confirm. The `confirmBranching` emits `addClass` with the new name. The composable's `addClass` checks `form.trainerClasses.length >= MAX_TRAINER_CLASSES` and silently returns without adding.

Result: the picker opens, the user makes a selection, clicks Confirm, and nothing happens. No feedback.

**Required fix:** `isClassDisabled` must account for max slots when a branching class is already selected:

```ts
function isClassDisabled(cls: TrainerClassDef): boolean {
  if (isClassSelected(cls.name)) {
    if (!cls.isBranching) return false
    // Branching: disabled if all specializations taken OR at max slots
    return isFullySpecialized(cls.name) || props.trainerClasses.length >= props.maxClasses
  }
  return props.trainerClasses.length >= props.maxClasses
}
```

### MEDIUM

#### M1: Researcher specialization model captures one field, but PTU mandates two per instance

**File:** `app/constants/trainerClasses.ts` (lines 112-114)

PTU Core p. 140: "Choose **two** Researcher Fields of Study. You may take Features from those Fields with this instance of Researcher."

The current dropdown lets the user pick one field (e.g., "Researcher: General Ed"), but each Researcher instance grants TWO fields. This means the stored string only records half the information.

**Required fix:** Either:
- (a) Accept this as a known simplification and add a code comment documenting the deviation, OR
- (b) Change the Researcher specialization format to encode both fields (e.g., "Researcher: General Ed / Pokemon Ed")

Option (a) is acceptable for this ticket's scope since the tool is an aid, not a rules enforcer. But the deviation should be documented.

#### M2: `countClassInstances` is exported dead code

**File:** `app/composables/useCharacterCreation.ts` (lines 197-203, 401)

The `countClassInstances` function is defined and exported from the composable but is not consumed by any component. While utility functions for future use are not inherently bad, exposing unused functions from a composable inflates its public API. Either use it in the UI (e.g., to show a count badge on branching class buttons) or remove it until needed.

**Required fix:** Remove `countClassInstances` from the composable and its return object, or add a consuming usage in ClassFeatureSection.vue.

## What Looks Good

1. **Decree-022 compliance.** The core approach -- colon separator, string array preservation, prefix matching -- exactly matches the decree's ruling. The `hasBaseClass`, `getBaseClassName`, and `getSpecialization` helper trio is well-designed with clear JSDoc examples.

2. **Immutability preserved.** `addClass` uses spread (`[...form.trainerClasses, className]`), `removeClass` uses filter. No mutations.

3. **Free-text input replaced with constrained dropdown.** Converting the branching specialization input from a free-text field to a `<select>` dropdown eliminates typos and invalid entries. The `availableSpecializations` computed property correctly excludes already-taken specializations.

4. **Commit granularity is good.** Four focused commits: data + helpers, logic fix, UI, cleanup. Each is a distinct logical unit.

5. **`hasBaseClass` prevents false prefix matches.** The check `classEntry.startsWith(\`${baseName}: \`)` uses the `: ` separator, preventing "Ace Trainer" from matching a "Ace" prefix. This is a deliberate and correct design choice.

6. **`getBaseClassName` only strips suffixes for known branching classes.** If a non-branching class happens to contain `: ` in its name, the function preserves the full string. Defensive and correct.

7. **`[Branch]` tag indicator in UI.** Replacing the `*` with `[Branch]` makes the branching behavior visible and matches PTU terminology.

## Verdict

**CHANGES_REQUIRED**

The Martial Artist `[Branch]` classification is a PTU rules correctness bug (CRITICAL). The silent failure of the specialization picker at max slots is a UX bug (HIGH). Both must be fixed before this can be approved.

## Required Changes

1. **[C1] Remove Martial Artist from branching classes.** Remove `isBranching: true` from the Martial Artist TRAINER_CLASSES entry. Remove `'Martial Artist'` from `BRANCHING_CLASS_SPECIALIZATIONS`. This is the only CRITICAL blocker.

2. **[H1] Disable branching class button when at max slots.** Update `isClassDisabled` to return `true` for branching classes when `trainerClasses.length >= maxClasses`, even if more specializations are available.

3. **[M1] Document Researcher two-field simplification.** Add a comment on the Researcher entry in `BRANCHING_CLASS_SPECIALIZATIONS` noting that PTU grants two fields per instance but the tool records one for simplicity.

4. **[M2] Remove or use `countClassInstances`.** Remove the dead code from the composable, or wire it into the UI.
