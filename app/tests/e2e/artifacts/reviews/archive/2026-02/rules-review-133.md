---
review_id: rules-review-133
review_type: rules
reviewer: game-logic-reviewer
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
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-23T10:15:00Z
follows_up: null
---

## Review Scope

Rules review for feature-001 P0 (B2W2 Trainer Sprites). The scope is to verify that trainer sprite rendering is purely cosmetic and that no game mechanics (combat, stats, capture, rest, healing, initiative, movement, damage, status conditions, equipment) were inadvertently modified in the 19 modified files.

## Methodology

Each of the 19 modified files was read in full. The diff for each was analyzed to confirm that only avatar/sprite rendering code was added or changed, and that no game logic functions, computed properties, emits, or API calls related to PTU mechanics were altered.

## File-by-File Verification

### Combat Components (6 files)

**CombatantCard.vue** — Changes limited to: (1) importing `useTrainerSprite`, (2) adding `avatarUrl` computed that calls `getTrainerSpriteUrl`, (3) template change to show sprite image in the avatar div. All combat logic untouched: damage/heal emits, stage modifiers, status conditions, capture rate calculation, initiative display, HP controls, turn state. The `calculateCaptureRateLocal` call and its parameters are identical to pre-PR code.

**PlayerCombatantCard.vue** — Same pattern: import + computed + template. Health bar calculation (`getHealthPercentage`, `getHealthStatus`), status conditions, fainted check, turn indicator all unchanged.

**GroupCombatantCard.vue** — Same pattern. Health bar, status, fainted, 4K media queries all unchanged.

**GMActionModal.vue** — Added trainer sprite rendering in the header section. All move execution logic, maneuver handling, status condition add/remove, frequency checking (`checkMoveFrequency`), struggle move definition, turn state tracking completely untouched. The Struggle move still has correct PTU values (DB 4, AC 4, Typeless, At-Will).

**AddCombatantModal.vue** — Changed avatar display in human entity list. Selection logic, initiative bonus input, `confirmAdd` emit all unchanged. No combat logic exists in this component.

**CombatantDetailsPanel.vue** — Added trainer sprite rendering in header. All game logic verified untouched: `getEffectiveMaxHp` (injury-adjusted HP), HP percentage calculation, stat display (`getStatValue`), combat stage formatting (with correct EVA+ label for evasion bonus), move/ability display, status condition rendering, frequency formatting.

### VTT Component (1 file)

**VTTToken.vue** — Changed `avatarUrl` computed to use `getTrainerSpriteUrl` for human characters instead of returning null. Token positioning, HP bar calculation, fainted state, click handling, size badge all unchanged. No movement or grid logic was modified.

### Group View Components (3 files)

**PlayerLobbyView.vue** — Added trainer sprite in player card avatar area. Pokemon team rendering, HP bar classes (`getHpClassFromPercent`), type pips all unchanged. No game logic exists in this component.

**InitiativeTracker.vue** — Added trainer sprite rendering for human combatants in the initiative list. Initiative ordering, phase title logic (`PHASE_TITLES` map), HP percentage and class calculations (`getEffectiveMaxHp`, injury-aware), `getCombatantName` all unchanged.

**SceneView.vue** — Added trainer sprite rendering for character avatars in the group view scene. Weather overlay, group member counting, sprite positioning all unchanged. No game logic exists in this component.

### Scene Components (2 files)

**SceneCanvas.vue** — Changed character avatar rendering to show trainer sprites. All drag-and-drop logic (sprite dragging, group dragging, resize handles), hit-test calculations, position clamping, group drop detection untouched.

**SceneAddPanel.vue** — Changed character list avatar to show trainer sprites. Add-character and add-pokemon emit logic unchanged.

### Character Lifecycle (5 files)

**CharacterModal.vue** — Added trainer sprite picker for editing, resolved avatar URL for display. Save logic (`emit('save', editData.value)`), equipment tracking, WebSocket broadcast for encounter equipment changes, encounter membership check all unchanged.

**HumanCard.vue** — Changed avatar rendering to use resolved sprite URL. No game logic exists in this component (it is a display card with a NuxtLink).

**gm/characters/[id].vue** — Added trainer sprite picker in edit mode, resolved avatar URL. All game logic untouched: `loadCharacter` API call, `saveChanges` via `libraryStore.updateHuman`, equipment state tracking, WebSocket broadcast, encounter membership check, derived trainer capabilities (`computeTrainerDerivedStats`).

**gm/create.vue** — Added trainer sprite picker to both Quick Create and Full Create forms. Full Create composable usage unchanged. Pokemon creation form and its PTU HP formula (`Level + (HP Base * 3) + 10`) unchanged. Quick Create payload building unchanged (the `QuickCreatePayload` type was extended with optional `avatarUrl` which is purely cosmetic data).

**QuickCreateForm.vue** — Added sprite picker and avatar preview. The `handleSubmit` function still builds the correct payload with PTU trainer HP formula (`Level * 2 + HP Stat * 3 + 10`), correct money logic (PCs get standard starting money, NPCs get 0), and all stat fields. The `avatarUrl` field is passed through as an optional cosmetic property.

### Type & Composable Files (2 files)

**character.ts** — Added `avatarUrl?: string` to `QuickCreatePayload`. No stat, combat, or mechanic interfaces were modified. `HumanCharacter` already had `avatarUrl?: string` (line 265).

**useCharacterCreation.ts** — Added `avatarUrl: null as string | null` to the form reactive object. The `buildCreatePayload` function passes it through as `avatarUrl: form.avatarUrl || undefined`. No stat calculation, skill validation, background application, edge logic, or HP formula was modified.

## PTU Mechanics Integrity Check

| Mechanic | Status | Notes |
|----------|--------|-------|
| HP calculation | Unchanged | Trainer: `Level * 2 + HP Stat * 3 + 10`. Pokemon: `Level + (Base HP * 3) + 10` |
| Damage application | Unchanged | CombatantCard emit pattern identical |
| Capture rate | Unchanged | `calculateCaptureRateLocal` parameters and display unchanged |
| Initiative | Unchanged | Sorting, rolloff display, phase titles all intact |
| Combat stages | Unchanged | -6 to +6 range, stat name formatting (EVA+ distinction) intact |
| Status conditions | Unchanged | Persistent/volatile/other categories, add/remove logic intact |
| Move frequency | Unchanged | `checkMoveFrequency` call and exhaustion display intact |
| Equipment | Unchanged | Equip/unequip, WebSocket broadcast, encounter check intact |
| Rest/healing | Unchanged | `getEffectiveMaxHp` (injury-aware) intact in all HP displays |
| Evasions | Unchanged | `floor(stat / 5)` capped at +6, composable logic intact |
| Maneuvers | Unchanged | ManeuverGrid integration and emit pattern intact |

## Verdict

**APPROVED**

All changes are strictly cosmetic (avatar rendering). No PTU game mechanics, formulas, or logic were modified in any of the 19 files. The trainer sprite system is a pure display layer that reads the existing `avatarUrl` field and resolves it to a Showdown CDN URL.
