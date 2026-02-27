---
review_id: code-review-146
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-001
domain: character-lifecycle
commits_reviewed:
  - 477547f
  - 2cb1710
  - e1c2562
  - ae3ac24
  - cca2210
  - 0757f5c
files_reviewed:
  - app/components/character/HumanCard.vue
  - app/components/encounter/AddCombatantModal.vue
  - app/components/scene/SceneAddPanel.vue
  - app/components/character/CharacterModal.vue
  - app/components/group/PlayerLobbyView.vue
  - app/pages/gm/characters/[id].vue
  - app/pages/gm/create.vue
  - app/components/create/QuickCreateForm.vue
  - app/components/encounter/GMActionModal.vue
  - app/components/group/InitiativeTracker.vue
  - app/components/vtt/VTTToken.vue
  - app/components/group/CombatantDetailsPanel.vue
  - .claude/skills/references/app-surface.md
  - app/tests/e2e/artifacts/tickets/feature/feature-001.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-23T12:30:00Z
follows_up: code-review-143
---

## Review Scope

Re-review of feature-001 P0 fix cycle. The previous review (code-review-143) was CHANGES_REQUIRED with C1 (CRITICAL: defineProps crash), H1 (HIGH: GMActionModal >800 lines), M1 (double invocation in v-for), M2 (inconsistent avatar error handling), M3 (missing app-surface update). The developer applied 6 fix commits across 13 files. This review verifies all issues are resolved.

## Previous Issue Resolution

### C1: defineProps crash in HumanCard.vue -- RESOLVED

Commit `477547f` correctly assigns the return value of `defineProps` to `const props` (line 59). The `resolvedAvatarUrl` computed now correctly references `props.human.avatarUrl` (line 69). The fix also added the reactive null-out pattern for error handling, which was a bonus improvement aligned with M2.

Verified: `app/components/character/HumanCard.vue` line 59: `const props = defineProps<{ human: HumanCharacter }>()`.

### H1: GMActionModal >800 lines -- ACKNOWLEDGED (deferred)

GMActionModal.vue is now 809 lines (was 803 before the fix commits, increased by 6 lines from the new `avatarBroken` reactive pattern in commit `ae3ac24`). Refactoring ticket `refactoring-075` exists with correct metadata (`source: code-review-143 H1`, `category: EXT-GOD`, `priority: P4`). The ticket correctly identifies the status conditions section as the extraction target. Not blocking this review.

### M1: Double invocation of getTrainerSpriteUrl in v-for -- RESOLVED

Commit `2cb1710` adds `<!-- deliberate: lightweight function in v-for, no per-item computed available -->` comments to both `AddCombatantModal.vue` (line 81) and `SceneAddPanel.vue` (line 43). The comments explain why the double call is intentional in the v-for context. This is the approach suggested by the original review.

Verified in both files.

### M2: Inconsistent avatar error handling -- RESOLVED (with new issue, see M1 below)

The developer standardized on the reactive null-out pattern across all files. Three distinct approaches were used, all correct for their context:

**Pattern A -- `avatarBroken` ref (single-entity components):**
Used in `HumanCard.vue`, `CharacterModal.vue`, `QuickCreateForm.vue`, `gm/characters/[id].vue`, `gm/create.vue`, `GMActionModal.vue`, `VTTToken.vue`, `CombatantDetailsPanel.vue`. When `@error` fires, `avatarBroken.value = true`, and the computed resolves to `null`, causing the `v-else` letter-initial fallback to render.

**Pattern B -- `brokenAvatars` Set by entity ID (v-for components):**
Used in `PlayerLobbyView.vue` and `InitiativeTracker.vue`. A `Set<string>` keyed by player/combatant ID tracks which specific items have broken avatars. The `v-if` condition checks both `getTrainerSpriteUrl(...)` and `!brokenAvatars.has(id)`. Immutable Set update via `new Set([...brokenAvatars.value, id])`.

**Pattern C -- Conditional in shared handler (VTTToken):**
`handleSpriteError` checks `isPokemon.value`: if true, falls back to placeholder (correct for Pokemon); if false, sets `avatarBroken.value = true` (correct for humans).

The `pokemon-placeholder.svg` fallback is now correctly reserved for Pokemon-only error paths (`HumanCard.vue` line 78 for Pokemon team sprites, `PlayerLobbyView.vue` line 118 for Pokemon sprites, `InitiativeTracker.vue` line 84 for Pokemon sprites, `CombatantDetailsPanel.vue` line 196 for Pokemon sprites, `VTTToken.vue` line 148 for Pokemon sprites). Human character avatars consistently fall through to the letter-initial `v-else` branch.

### M3: Missing app-surface.md update -- RESOLVED

Commit `cca2210` adds a "Trainer sprites" paragraph under the Characters section in `app-surface.md`, listing all three new files: `constants/trainerSprites.ts`, `composables/useTrainerSprite.ts`, `components/character/TrainerSpritePicker.vue`. Description is accurate and follows the existing format.

## Issues

### MEDIUM

**M1: `avatarBroken` ref not reset when entity changes in reused components**

Files: `app/components/group/CombatantDetailsPanel.vue`, `app/components/character/CharacterModal.vue`, `app/pages/gm/characters/[id].vue`

The `avatarBroken` ref is initialized to `false` on mount but is never reset when the displayed entity changes via prop update or route param change.

**CombatantDetailsPanel.vue** (highest impact): This component is always mounted in the group encounter view (no `v-if` guard). As the encounter progresses and `currentCombatant` changes, the `:combatant` prop updates. If Human A has a broken avatar image, `avatarBroken` becomes `true`. When the turn advances to Human B (who has a valid avatar), `avatarBroken` is still `true`, so the computed returns `null` and the letter-initial fallback renders instead of the sprite.

**CharacterModal.vue**: Has a watcher on `props.character` (line 321) that resets `activeTab` and `editData` but does not reset `avatarBroken`. If the modal is shown for Character A (broken avatar), closed, then shown for Character B (valid avatar), the `v-if` guard means Vue destroys/recreates the component, so this case is safe. However, if the parent directly swaps the `character` prop without unmounting (which the existing watcher is designed to handle), the stale `avatarBroken` would suppress the avatar.

**gm/characters/[id].vue**: Has a watcher on `characterId` (line 360) that calls `loadCharacter()` but does not reset `avatarBroken`. When navigating from `/gm/characters/abc` (broken avatar) to `/gm/characters/def` (valid avatar), Nuxt reuses the same page component instance because the route template is the same. The `avatarBroken` ref stays `true`.

**Fix for CombatantDetailsPanel.vue:** Add a watcher:
```typescript
watch(() => props.combatant?.id, () => {
  avatarBroken.value = false
})
```

**Fix for gm/characters/[id].vue:** Reset in the existing watcher:
```typescript
watch(characterId, async () => {
  avatarBroken.value = false
  await loadCharacter()
})
```

**Fix for CharacterModal.vue:** Reset in the existing watcher:
```typescript
watch(() => props.character, () => {
  activeTab.value = 'stats'
  editData.value = { ...props.character }
  avatarBroken.value = false
})
```

**M2: GMActionModal.vue file size increased to 809 lines**

File: `app/components/encounter/GMActionModal.vue` -- 809 lines

The fix cycle itself added 6 lines (avatarBroken ref, computed, handler) to a file that was already 803 lines. The file is now 809 lines, 9 lines over the 800-line project maximum. While refactoring-075 covers the long-term extraction, the fix cycle worsened the overage rather than holding it stable. This is not blocking since the refactoring ticket exists, but worth noting that each additional touch point increases the debt.

## What Looks Good

1. **C1 fix is clean and correct.** The `const props = defineProps<...>()` assignment follows the exact pattern used in other files like `CombatantCard.vue` and `PlayerCombatantCard.vue`. No extra changes, no scope creep.

2. **Consistent reactive null-out pattern.** The developer chose one pattern (Pattern A for single-entity, Pattern B for v-for) and applied it uniformly. The `avatarBroken` ref + computed that returns `null` when broken is a clean approach that integrates with existing `v-if`/`v-else` template branching without adding template complexity.

3. **Immutability preserved.** The `brokenAvatars` Set updates in `PlayerLobbyView.vue` and `InitiativeTracker.vue` use `new Set([...brokenAvatars.value, id])` rather than mutating the existing Set. This follows the project's immutability guidelines.

4. **Pokemon sprite error handling preserved.** The `pokemon-placeholder.svg` fallback was correctly kept for Pokemon sprite `@error` handlers. Only human character avatar error handlers were changed to the reactive null-out pattern. The `VTTToken.vue` handler (lines 145-152) correctly branches on `isPokemon.value`.

5. **v-for comment convention.** The `<!-- deliberate: lightweight function in v-for, no per-item computed available -->` comment is clear, explains the reasoning, and prevents future reviewers from flagging the same pattern.

6. **Commit granularity.** The 6 commits are well-organized: one per original issue (C1, M1, M2 Strategy 1, M2 Strategy 2, M3) plus a resolution log update. Each commit is focused and small. The M2 fix was appropriately split into two commits -- one for Strategy 1 files (hide → null-out) and one for Strategy 2 files (placeholder → null-out).

7. **app-surface.md entry is thorough.** The description covers all three files with their purpose, not just file names. Follows the existing format.

## Verdict

**CHANGES_REQUIRED**

M1 is a real bug that will manifest in the group encounter view when turns alternate between human combatants with and without valid avatars. The fix is a one-line watcher addition per affected file. M2 is informational only (refactoring-075 covers it).

## Required Changes

| ID | Severity | File | Fix |
|----|----------|------|-----|
| M1 | MEDIUM | `CombatantDetailsPanel.vue` | Add watcher on `props.combatant?.id` to reset `avatarBroken` to `false` |
| M1 | MEDIUM | `gm/characters/[id].vue` | Reset `avatarBroken = false` in the `characterId` watcher |
| M1 | MEDIUM | `CharacterModal.vue` | Reset `avatarBroken = false` in the `props.character` watcher |
| M2 | MEDIUM | `GMActionModal.vue` | Informational -- file is 809 lines, covered by refactoring-075 |
