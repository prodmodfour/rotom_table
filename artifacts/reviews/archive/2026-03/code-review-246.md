---
review_id: code-review-246
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-009
domain: character-lifecycle
commits_reviewed:
  - 1963e0e1
  - 31c5891e
  - 50dae4ec
  - 6e2acbc6
  - 007d50aa
  - 4ecbfad1
  - ddb17b85
  - 0c8194a0
  - 4ad71c74
  - 4b2a0ac9
files_reviewed:
  - app/utils/trainerExperience.ts
  - app/prisma/schema.prisma
  - app/types/character.ts
  - app/server/utils/serializers.ts
  - app/server/api/characters/[id].put.ts
  - app/server/api/characters/[id]/xp.post.ts
  - app/server/api/characters/[id]/xp-history.get.ts
  - app/composables/useTrainerXp.ts
  - app/components/character/TrainerXpPanel.vue
  - app/components/character/CharacterModal.vue
  - app/pages/gm/characters/[id].vue
  - app/tests/unit/utils/trainerExperience.test.ts
  - app/tests/unit/api/trainerXp.test.ts
  - app/tests/unit/composables/useTrainerXp.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 3
reviewed_at: 2026-03-01T14:10:00Z
follows_up: null
---

## Review Scope

First review of feature-009 (Trainer XP & Advancement Tracking) P0 implementation. 10 commits implementing:

- `trainerExperience.ts` -- pure XP utility (thresholds, award/deduct, multi-level jump, max level cap)
- Prisma schema -- `trainerXp` + `capturedSpecies` fields on `HumanCharacter`
- Types/serializers -- `HumanCharacter` interface and serialization updated
- `POST /api/characters/:id/xp` -- award/deduct endpoint with auto-level
- `GET /api/characters/:id/xp-history` -- XP state endpoint
- `useTrainerXp` composable -- client-side XP management with level-up detection
- `TrainerXpPanel.vue` -- GM UI for XP display and quick-award buttons
- Integration into `gm/characters/[id].vue` and `CharacterModal.vue`
- 47 unit tests across 3 test files (T1-T4)

### Decree Check

Reviewed decrees 022, 026, 027, 037. None of these are directly applicable to the trainer XP system (they concern branch classes, Martial Artist classification, Pathetic skill edges, and skill rank sources). No decree violations found. The design references decree-030 (significance cap at x5) and the implementation correctly caps `TRAINER_XP_SUGGESTIONS` at 5 XP. No new ambiguities discovered.

---

## Issues

### HIGH-01: Stale data in CharacterModal after XP award

**File:** `app/components/character/CharacterModal.vue` lines 356-359

The `handleXpChanged` handler attempts to refresh character data by re-assigning from props:

```typescript
function handleXpChanged(_payload: { newXp: number; newLevel: number }) {
  editData.value = { ...props.character }
}
```

This does nothing useful. After the XP endpoint updates the database, `props.character` still holds the pre-award data because the CharacterModal's parent has not re-fetched. The modal emits only `close` and `save` -- there is no mechanism to signal the parent to refresh character data. As a result:

1. The `TrainerXpPanel` displays the old XP value after awarding XP (since it binds to `humanData` which is `props.character`).
2. The `-1` button disable check (`character.trainerXp === 0`) operates on stale data.
3. If the GM awards XP again, the server computes from the correct DB value, but the UI shows the old bank value, leading to confusing feedback.

**Fix required:** Either:
- (a) Add a `refresh` emit to `CharacterModal` and have the parent re-fetch, OR
- (b) Use the `_payload` parameter (which contains `newXp` and `newLevel`) to locally update `editData` AND ensure `humanData` reflects the update (e.g., by patching `editData` and changing the panel to use `editData` instead of `humanData` in view mode), OR
- (c) Have the composable's response data update the character prop directly via the library store

Option (a) is cleanest and follows existing patterns (the character page's `handleXpChanged` correctly calls `await loadCharacter()`).

### HIGH-02: app-surface.md not updated

**File:** `.claude/skills/references/app-surface.md`

Two new API endpoints and one new component were added but `app-surface.md` was not updated:
- `POST /api/characters/:id/xp` (new endpoint)
- `GET /api/characters/:id/xp-history` (new endpoint)
- `TrainerXpPanel.vue` (new component in `components/character/`)
- `useTrainerXp` composable (new composable)
- `trainerExperience.ts` utility (new utility)

Per the review checklist: "If new endpoints/components/routes/stores: was app-surface.md updated?" This is a required artifact update.

### MEDIUM-01: xp-history endpoint returns negative xpToNextLevel at max level

**File:** `app/server/api/characters/[id]/xp-history.get.ts` line 38

```typescript
xpToNextLevel: TRAINER_XP_PER_LEVEL - character.trainerXp
```

At max level (50), the XP bank can accumulate past 10 (since no levels are consumed). If `trainerXp` is 13, `xpToNextLevel` returns -3. This is incorrect data that any future consumer would need to guard against.

**Fix:** Return `null` or `0` when at max level:

```typescript
const isMaxLevel = character.level >= TRAINER_MAX_LEVEL
// ...
xpToNextLevel: isMaxLevel ? null : TRAINER_XP_PER_LEVEL - character.trainerXp
```

Import `TRAINER_MAX_LEVEL` alongside `TRAINER_XP_PER_LEVEL`.

### MEDIUM-02: Duplicate award logic in TrainerXpPanel

**File:** `app/components/character/TrainerXpPanel.vue` lines 131-151 and 154-182

`handleAward()` and `handleCustomAward()` contain nearly identical logic: call `awardXp`, emit `xp-changed`, check `levelsGained`, emit `level-up`, and handle errors. The only differences are: (a) the reason string, and (b) the custom input cleanup. This is a code smell that will diverge if either path is updated.

**Fix:** Extract the shared logic into a private helper:

```typescript
async function processXpAward(amount: number, reason: string) {
  const result = await awardXp(props.character.id, amount, reason)
  emit('xp-changed', { newXp: result.newXp, newLevel: result.newLevel })
  if (result.levelsGained > 0) {
    emit('level-up', {
      oldLevel: result.previousLevel,
      newLevel: result.newLevel,
      character: { ...props.character, level: result.newLevel, trainerXp: result.newXp }
    })
  }
  return result
}
```

Then `handleAward` and `handleCustomAward` each call `processXpAward` with their respective reason strings.

### MEDIUM-03: console.log in XP endpoint

**File:** `app/server/api/characters/[id]/xp.post.ts` lines 69-75

The endpoint uses `console.log` for audit logging. No other API endpoint in `server/api/` uses `console.log`. The project coding style says "No console.log statements." While the design spec acknowledges this is a P0 placeholder for a future `TrainerXpLog` model, the `console.log` should at minimum be gated behind an environment check or use a structured logger pattern that other server code uses.

**Fix:** Either (a) remove the console.log entirely (the data is returned in the API response and can be observed client-side), or (b) file a ticket now for the proper audit log model and leave a `// TODO: ticket-XXX` comment referencing it.

---

## What Looks Good

1. **Pure utility design.** `trainerExperience.ts` is a textbook pure function. Same input always produces same output. No side effects. Fully testable. The multi-level jump logic (`Math.floor(rawTotal / TRAINER_XP_PER_LEVEL)`) is elegant and correct. The max-level cap with XP overflow preservation handles the edge case properly.

2. **PTU rule fidelity.** The XP bank mechanics match PTU Core p.461 exactly: 10 XP per level, bank cannot go negative, multi-level jumps consume full 10-XP chunks, milestones are separate. The `TRAINER_XP_SUGGESTIONS` correctly caps at 5 per decree-030.

3. **Test coverage is thorough.** 47 tests across three tiers: T1 (pure utility -- 20 tests covering basic, multi-level, max level, deduction, edge cases), T2 (isNewSpecies -- 5 tests), T3 (API endpoint -- 13 tests with mocked Prisma/WebSocket), T4 (composable -- 9 tests with mocked $fetch). Every edge case from the design spec's P0 Edge Cases table is covered.

4. **Immutability patterns.** The component creates spread copies when emitting level-up events (`{ ...props.character, level: result.newLevel, trainerXp: result.newXp }`). The composable returns `readonly()` refs. No prop mutation anywhere.

5. **Input validation on the endpoint.** The XP endpoint validates: ID presence, amount is integer, amount is non-zero, amount is within [-100, 100], character exists. All 400/404 error paths are tested.

6. **Serializer consistency.** Both `serializeCharacter` and `serializeCharacterSummary` include `trainerXp` and `capturedSpecies` (with JSON parsing). The PUT endpoint handles both fields. No inconsistency between detail and list views.

7. **Component design.** The TrainerXpPanel is well-scoped (props + emits, no store dependencies), uses BEM SCSS naming, follows existing button class patterns (`btn btn--sm`), and correctly disables during active encounters.

8. **Level-up chain wiring.** The XP -> LevelUpModal chain is correctly designed: TrainerXpPanel emits `level-up` with `oldLevel`/`newLevel`, parent sets `levelUpTargetLevel` and opens the modal. This reuses feature-008's existing infrastructure without modification.

9. **Commit granularity.** 10 commits with clear separation: schema, types/serializers, pure utility, endpoints, composable, component, integration, JSDoc fix, tests, docs. Each commit produces a working state.

---

## Verdict

**CHANGES_REQUIRED**

The core XP logic is correct and well-tested. The two HIGH issues must be fixed before merge:

- **HIGH-01** causes visible stale data in the CharacterModal UI after awarding XP, breaking the user's feedback loop.
- **HIGH-02** is a required process step (app-surface.md update for new endpoints/components).

The three MEDIUM issues should be fixed in the same pass since the developer is already in these files.

---

## Required Changes

1. **[HIGH-01]** Fix CharacterModal stale data after XP award. Add a `refresh` emit (or equivalent) so the parent re-fetches character data. Ensure the TrainerXpPanel displays current XP after each award.

2. **[HIGH-02]** Update `app-surface.md` with the new endpoints (`POST /api/characters/:id/xp`, `GET /api/characters/:id/xp-history`), new component (`TrainerXpPanel.vue`), new composable (`useTrainerXp`), and new utility (`trainerExperience.ts`).

3. **[MEDIUM-01]** Fix `xp-history.get.ts` to return `null` for `xpToNextLevel` when character is at max level (50).

4. **[MEDIUM-02]** Extract shared XP award logic in `TrainerXpPanel.vue` into a `processXpAward()` helper to eliminate duplication between `handleAward` and `handleCustomAward`.

5. **[MEDIUM-03]** Remove or replace the `console.log` in `xp.post.ts`. If keeping as a placeholder, add a `// TODO` comment referencing the future audit log model.
