---
review_id: code-review-143
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-001
domain: character-lifecycle
commits_reviewed:
  - 7f9dd1f
  - 0a9c67d
  - d78d29d
  - 86ce748
  - 76fb481
  - 9d56757
  - 3393ffd
  - 309ca83
files_reviewed:
  - app/constants/trainerSprites.ts
  - app/composables/useTrainerSprite.ts
  - app/components/character/TrainerSpritePicker.vue
  - app/components/character/HumanCard.vue
  - app/components/character/CharacterModal.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/PlayerCombatantCard.vue
  - app/components/encounter/GroupCombatantCard.vue
  - app/components/encounter/AddCombatantModal.vue
  - app/components/encounter/GMActionModal.vue
  - app/components/vtt/VTTToken.vue
  - app/components/group/PlayerLobbyView.vue
  - app/components/group/InitiativeTracker.vue
  - app/components/group/CombatantDetailsPanel.vue
  - app/components/scene/SceneCanvas.vue
  - app/components/scene/SceneAddPanel.vue
  - app/pages/gm/characters/[id].vue
  - app/pages/gm/create.vue
  - app/pages/group/_components/SceneView.vue
  - app/components/create/QuickCreateForm.vue
  - app/composables/useCharacterCreation.ts
  - app/types/character.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 3
reviewed_at: 2026-02-23T10:15:00Z
follows_up: null
---

## Review Scope

Feature-001 P0: B2W2 Trainer Sprites for NPC/Player Avatars. This review covers the full P0 implementation across 22 files (988 insertions, 27 deletions), including 3 new files (trainerSprites.ts, useTrainerSprite.ts, TrainerSpritePicker.vue) and 19 modified files integrating trainer sprite rendering across GM, Group, and encounter views.

## Issues

### CRITICAL

**C1: `props` not defined in HumanCard.vue script — runtime error**

File: `app/components/character/HumanCard.vue`, line 66

```typescript
defineProps<{
  human: HumanCharacter
}>()

// ...
const resolvedAvatarUrl = computed(() => getTrainerSpriteUrl(props.human.avatarUrl ?? null))
```

`defineProps` is called without assigning its return value, but `props.human` is referenced in the script block. In Vue 3 `<script setup>`, when `defineProps()` is not assigned to a variable, the props are accessible only in the template by their bare names. Referencing `props.human` in script will throw `ReferenceError: props is not defined` at runtime.

**Fix:** Either assign `const props = defineProps<...>()` or change the computed to use the template-accessible variable pattern via a separate approach (e.g., `const { human } = defineProps<...>()` and then reference `human.avatarUrl`). The `const props = defineProps<...>()` pattern is already used correctly in other files like `CombatantCard.vue` and `PlayerCombatantCard.vue`.

### HIGH

**H1: GMActionModal.vue exceeds 800-line limit (803 lines)**

File: `app/components/encounter/GMActionModal.vue` — 803 lines

The file was already close to the limit before this PR (approximately 781 lines). The 22-line addition for trainer sprite rendering pushed it over the 800-line project maximum. Per project coding standards, this must be addressed.

**Fix:** Extract the status conditions section (lines 151-223 template, lines 332-348 script, lines 756-801 styles, approximately 130 lines total) into a standalone `CombatantConditionsSection.vue` component. This is a natural SRP extraction point that would bring GMActionModal under 700 lines and improve testability. File this as a follow-up refactoring ticket if not addressed in this cycle, but it must not be deferred indefinitely.

### MEDIUM

**M1: Double invocation of `getTrainerSpriteUrl` in templates**

Files: `app/components/encounter/AddCombatantModal.vue` (line 82), `app/components/scene/SceneAddPanel.vue` (line 44)

```html
<img v-if="getTrainerSpriteUrl(human.avatarUrl)" :src="getTrainerSpriteUrl(human.avatarUrl)!" :alt="human.name" />
```

`getTrainerSpriteUrl()` is called twice for the same input — once in the `v-if` and once in `:src`. While the function is cheap (string concatenation), this is a pattern inconsistency. Other files in this same PR (e.g., `CombatantDetailsPanel.vue`, `CharacterModal.vue`) correctly use a computed property to resolve the URL once and reference it in both the conditional and the src binding.

**Fix:** For `AddCombatantModal.vue`, since the avatar URL varies per list item in a `v-for`, a computed doesn't work directly. Extract a small helper or use a scoped slot pattern. Alternatively, accept the double call as a minor performance cost in a list context and add a `<!-- deliberate: lightweight function -->` comment so future reviewers don't flag it again.

For `SceneAddPanel.vue`, the same pattern applies in a `v-for`. Same resolution.

**M2: Inconsistent avatar error handling strategies**

Across the modified files, three different strategies are used for handling broken trainer sprite images:

1. **Hide the image** (`img.style.display = 'none'`): Used in `HumanCard.vue`, `CharacterModal.vue`, `PlayerLobbyView.vue`, `gm/characters/[id].vue`, `gm/create.vue`, `QuickCreateForm.vue`
2. **Replace with placeholder** (`img.src = '/images/pokemon-placeholder.svg'`): Used in `InitiativeTracker.vue`, `VTTToken.vue`, `CombatantDetailsPanel.vue`
3. **Filter out from catalog** (brokenKeys Set): Used in `TrainerSpritePicker.vue`

Strategy 1 hides the `<img>` element, but the component still renders the `v-if` branch that expects an image. The user sees nothing where the image should be, but the letter-initial fallback (`v-else`) does NOT render because `resolvedAvatarUrl` is still truthy. This creates a visual gap — no image AND no fallback letter.

Strategy 2 shows a Pokemon placeholder for a human character, which is thematically wrong.

**Fix:** Standardize on a reactive approach: when `@error` fires, null out the resolved URL ref so the `v-else` fallback renders the letter initial. This is already essentially what `TrainerSpritePicker.vue` does with its `brokenKeys` Set. Apply the same pattern to the avatar displays. At minimum, fix Strategy 1 so the letter fallback renders.

**M3: Missing `app-surface.md` update**

The project checklist requires updating `app-surface.md` when adding new components, composables, or constants. This PR adds:
- `app/constants/trainerSprites.ts` (new constant file)
- `app/composables/useTrainerSprite.ts` (new composable)
- `app/components/character/TrainerSpritePicker.vue` (new component)

None of these are reflected in `app-surface.md`.

**Fix:** Update `app-surface.md` to list the new files.

## What Looks Good

1. **Clean composable design.** `useTrainerSprite.ts` follows the exact same pattern as `usePokemonSprite.ts` — a composable returning URL-building helpers. The backward compatibility check for existing full URLs (`startsWith('http')`) is thoughtful and prevents breakage for any pre-existing `avatarUrl` values in the database.

2. **Comprehensive integration.** All 17+ avatar display points across GM, Group, and encounter views were updated. No rendering location was missed. The developer systematically worked through every component that displays a human character avatar.

3. **Well-organized sprite catalog.** The 180-entry catalog in `trainerSprites.ts` is cleanly structured with typed interfaces, 9 logical categories, and clear comments. The data structure supports the picker's category filtering without any runtime transformation.

4. **TrainerSpritePicker modal quality.** The picker component is well-built: category tabs, search filtering, broken image handling via `brokenKeys` Set (immutable pattern), lazy loading, proper v-model binding, and clean SCSS using project variables. The 290-line size is appropriate for its scope.

5. **Immutability adherence.** The `brokenKeys` Set update in `TrainerSpritePicker.vue` correctly creates a new Set via spread: `brokenKeys.value = new Set([...brokenKeys.value, key])`. The composable's `useCharacterCreation` form correctly includes `avatarUrl` in its reactive state.

6. **Commit granularity.** The 7 feature commits follow a clean progression: catalog -> composable -> picker -> create integration -> edit integration -> avatar rendering -> remaining displays. Each commit is focused and produces a working state.

7. **Proper type extension.** `QuickCreatePayload` in `character.ts` was extended with `avatarUrl?: string` to support sprite selection during quick creation.

8. **No game logic modifications.** The 19 modified files had changes strictly limited to avatar/sprite rendering. No combat, stat, capture, rest, or movement logic was touched.

## Verdict

**CHANGES_REQUIRED**

C1 is a runtime crash that must be fixed before merge. H1 (file size) should be filed as a follow-up ticket if not fixed in this cycle, but the file was already borderline before this PR so it is not a blocking regression from this feature. M1-M3 should be fixed now while the developer is in this code.

## Required Changes

| ID | Severity | File | Fix |
|----|----------|------|-----|
| C1 | CRITICAL | `app/components/character/HumanCard.vue` | Assign `defineProps` return to `const props` or destructure |
| H1 | HIGH | `app/components/encounter/GMActionModal.vue` | File a refactoring ticket to extract status conditions section; this is a pre-existing issue worsened by this PR |
| M1 | MEDIUM | `AddCombatantModal.vue`, `SceneAddPanel.vue` | Add comment acknowledging double call in v-for context, or extract to inline computed |
| M2 | MEDIUM | Multiple files | Standardize avatar error handling so letter-initial fallback renders on broken images |
| M3 | MEDIUM | `app-surface.md` | Add new constant, composable, and component to surface inventory |
