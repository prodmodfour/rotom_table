---
review_id: code-review-257
review_type: code+rules
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-009
domain: character-lifecycle
commits_reviewed:
  - 43d2467b
  - 1f49fd3e
  - 8b774ec7
  - 929545e7
  - 76c5c6a0
  - 08605245
  - 21492bca
  - be53980e
files_reviewed:
  - app/utils/trainerExperience.ts
  - app/composables/useTrainerXp.ts
  - app/components/character/TrainerXpPanel.vue
  - app/components/encounter/TrainerXpSection.vue
  - app/components/encounter/XpDistributionModal.vue
  - app/components/scene/QuestXpDialog.vue
  - app/pages/gm/scenes/[id].vue
  - app/server/api/characters/[id]/xp.post.ts
  - app/server/api/characters/[id]/xp-history.get.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/api/encounters/[id]/trainer-xp-distribute.post.ts
  - app/stores/encounterXp.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 3
reviewed_at: 2026-03-01T19:15:00Z
follows_up: code-review-253
---

## Review Scope

P1 implementation of feature-009 (Trainer XP & Advancement Tracking). 8 commits by slave-2 adding:
- Section E: +1 trainer XP on new species capture in `attempt.post.ts`
- Section F: Batch `trainer-xp-distribute` endpoint, `encounterXp` store action, `TrainerXpSection` component, `XpDistributionModal` integration
- Section G: `QuestXpDialog` component in scene detail view

Combined code quality (senior reviewer) and PTU rule correctness (game logic reviewer) review. Verified against PTU Core p.461 (trainer experience bank), p.460 (significance), and decree-030 (x5 preset cap).

---

## Issues

### HIGH-01: trainer-xp-distribute endpoint does not validate encounter exists

**File:** `app/server/api/encounters/[id]/trainer-xp-distribute.post.ts`

The endpoint accepts an encounter ID in the URL path but never verifies the encounter exists in the database. The `encounterId` parameter is validated for presence (line 23) but never used in a Prisma query. Compare with the sibling `xp-distribute.post.ts` which calls `loadEncounter(id)` to verify the encounter exists before processing.

This means:
1. Any arbitrary string as the encounter ID will succeed, making the URL parameter meaningless.
2. No encounter existence check means no guard against distributing trainer XP for a non-existent or deleted encounter.
3. Inconsistent with every other endpoint under `/api/encounters/[id]/`.

**Fix:** Add encounter existence validation at the top, matching the pattern in other encounter endpoints:

```typescript
import { loadEncounter } from '~/server/services/encounter.service'
// ...
const encounter = await loadEncounter(encounterId)
// loadEncounter throws 404 if not found
```

### HIGH-02: app-surface.md not updated for new endpoint, components, and store action

**File:** `.claude/skills/references/app-surface.md`

The P1 implementation adds 3 new artifacts that are not documented in the app surface map:

1. **Endpoint:** `POST /api/encounters/:id/trainer-xp-distribute` -- not listed under the Encounters API section (should be added near the existing `xp-distribute` entry around line 149).
2. **Component:** `TrainerXpSection.vue` -- not mentioned in the encounter components section (line 155 area).
3. **Component:** `QuestXpDialog.vue` -- not mentioned in the scene components or scene detail page documentation.
4. **Store mapping:** `encounterXp` store (line 246) should list `trainer-xp-distribute` alongside `xp-calculate, xp-distribute`.
5. **Trainer XP section** (line 90): should mention `SIGNIFICANCE_TO_TRAINER_XP` mapping alongside the existing `TRAINER_XP_SUGGESTIONS` reference.

Per the review checklist: "If new endpoints/components/routes/stores: was app-surface.md updated?" -- answer is NO.

**Fix:** Update all five areas listed above.

### MEDIUM-01: Partial failure in handleApply leaves no user feedback about trainer XP success/failure

**File:** `app/components/encounter/XpDistributionModal.vue` (lines 505-551)

The `handleApply` function distributes Pokemon XP first, then trainer XP. If Pokemon XP succeeds but trainer XP fails, the catch block fires with an alert, but Pokemon XP was already committed to the database. The user sees an error message but has no way to know that Pokemon XP succeeded while trainer XP failed.

Additionally, the trainer XP distribution result is completely discarded (line 536-539 -- the response is `await`ed but not stored). Even on full success, the results phase (line 543-544) only shows Pokemon XP results. The GM receives zero feedback about which trainers gained XP or leveled up.

**Fix:**
1. Store the trainer XP distribution result and display it in the results phase (could be a simple "Trainer XP: X gained Y XP, Z leveled up" summary).
2. If Pokemon XP succeeds but trainer XP fails, show a more specific message: "Pokemon XP applied successfully. Trainer XP distribution failed: [error]" and still transition to results phase for the Pokemon XP.

### MEDIUM-02: participatingTrainers reads stale trainerXp from combatant entity snapshot

**File:** `app/components/encounter/XpDistributionModal.vue` (line 353)

```typescript
trainerXp: (c.entity as { trainerXp?: number }).trainerXp ?? 0
```

The combatant entity is snapshotted when the combatant is added to the encounter. If a trainer captures a new species during the encounter (Section E awards +1 XP), the combatant entity snapshot is NOT updated. This means:
- The "Bank: X/10" display in `TrainerXpSection` could be off by 1+ XP.
- The level-up preview could be wrong (e.g., showing no level-up when one would actually occur, or vice versa).

The actual XP application on the server reads fresh DB data, so the final result is correct. The display issue affects GM decision-making during allocation.

**Fix:** Fetch fresh `trainerXp` and `level` data for participating trainers from the API when the modal opens, rather than reading from the stale combatant entity snapshot. A lightweight fetch to `/api/characters` filtered by the trainer IDs, or individual `/api/characters/:id/xp-history` calls, would provide accurate data.

### MEDIUM-03: XpDistributionModal.vue exceeds 800-line file limit (873 lines)

**File:** `app/components/encounter/XpDistributionModal.vue`

The file was already at 813 lines before P1 (pre-existing violation). P1 added ~60 lines for trainer XP integration (allocations ref, participatingTrainers computed, suggestedTrainerXp computed, canApply extension, handleApply trainer distribution), bringing it to 873 lines.

While this is technically a pre-existing issue, P1 made it worse. The trainer XP section integration adds meaningful complexity to an already-long file. The 273-line `<style>` block is a large contributor.

**Fix:** Extract the `<style>` block into a dedicated SCSS partial file (e.g., `assets/scss/components/_xp-distribution-modal.scss`) or extract a sub-component for the Pokemon XP distribution section. This is a pre-existing issue so it should be filed as a separate refactoring ticket rather than blocking P1.

---

## PTU Rules Correctness

### Verified Correct

1. **10 XP = 1 level (PTU Core p.461, line 2953):** `applyTrainerXp()` correctly subtracts 10 per level gained, handles multi-level jumps, and preserves remainder in bank. Verified against: "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level."

2. **+1 XP per new species capture (PTU Core p.461, line 2957-2960):** `attempt.post.ts` correctly awards +1 XP when `isNewSpecies()` returns true after a successful capture. The normalized species is added to `capturedSpecies`. Verified against: "Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience."

3. **Species list is append-only (E.6):** The `capturedSpecies` list only grows. Released Pokemon do not remove species. Per PTU: "species they did not previously own" -- once owned, the XP was earned.

4. **Trainer XP is GM-decided (PTU Core p.461, lines 2985-2999):** The batch distribution endpoint and UI correctly leave the XP amount to GM discretion with suggestions only. Verified against: "GMs will have to decide how much Trainer Experience to grant after each encounter."

5. **Significance mapping (decree-030):** The `SIGNIFICANCE_TO_TRAINER_XP` mapping `{ insignificant: 0, everyday: 1, significant: 3 }` matches the PTU guidance. All three tiers are within the decree-030 x5 cap. The quick-set buttons `[0, 1, 2, 3, 5]` also respect the cap. The `TRAINER_XP_SUGGESTIONS` in `trainerExperience.ts` caps at `critical: 5`.

6. **Milestone does not affect bank (PTU Core p.461, line 2956):** Not directly relevant to P1 since milestones are not implemented, but the Quest XP dialog awards bank XP (not milestone levels), which is the correct behavior for GM-awarded encounter/quest XP.

7. **Bank cannot go below 0:** `applyTrainerXp` clamps via `Math.max(0, currentXp + xpToAdd)`. Level cannot exceed 50 (`TRAINER_MAX_LEVEL`).

### Not Covered by P1 (acceptable scope)

- "hatches or evolves" species XP: P1 implements capture only. Hatch/evolve XP should be tracked as a future ticket.
- Retraining (PTU Core p.461): spending trainer XP to retrain features/edges/stats. Not in scope for P1.

---

## What Looks Good

1. **Clean separation of concerns:** Pure utility (`trainerExperience.ts`), composable (`useTrainerXp`), server endpoints, store action, and UI components are all properly separated. The spec's architecture was faithfully followed.

2. **Immutability in TrainerXpSection:** Allocation state uses `new Map()` spreads rather than mutating the existing Map. Event handlers create new Map instances on every update.

3. **TrainerXpSection level-up preview:** Uses the same `applyTrainerXp()` function as the server, ensuring preview accuracy (modulo the stale snapshot issue in MEDIUM-02).

4. **Sequential server processing:** `trainer-xp-distribute.post.ts` processes trainers sequentially to prevent race conditions, as the spec requires. Zero-XP entries are skipped.

5. **QuestXpDialog validation:** Properly validates `xpAmount >= 1`, disables award button when no characters exist, and provides clear feedback with the `isAwarding` loading state.

6. **Quest XP scene refresh:** `handleQuestXpAwarded` correctly re-fetches all characters to update the `allCharacters` ref, ensuring the scene page reflects updated levels/XP.

7. **Encounter significance tier fallback:** `suggestedTrainerXp` computed gracefully falls back from the encounter's persisted `significanceTier` to the selected preset to a default of 1.

8. **canApply validation:** Extended to allow Apply when only trainer XP is allocated (no Pokemon XP required), per the spec. The `totalTrainerXp > 0` check is correct.

9. **Phosphor Icons usage:** QuestXpDialog uses `PhX` icon component. Scene detail uses `PhStar` for the Award Quest XP button. Both follow project icon conventions.

10. **Commit granularity:** 8 small commits with clear descriptions. Each commit represents a single logical change.

---

## Verdict

**CHANGES_REQUIRED**

Two HIGH issues must be fixed before approval:
1. **HIGH-01:** `trainer-xp-distribute` endpoint must validate encounter existence (consistency with other endpoints, prevents phantom encounter IDs).
2. **HIGH-02:** `app-surface.md` must be updated for the new endpoint, components, and store action.

Three MEDIUM issues should be fixed now while the developer is in this code:
1. **MEDIUM-01:** Trainer XP result feedback is completely lost -- GM gets zero confirmation of trainer XP awards.
2. **MEDIUM-02:** Stale `trainerXp` data from combatant snapshot misleads GM during allocation.
3. **MEDIUM-03:** File the 873-line `XpDistributionModal.vue` as a refactoring ticket (pre-existing, not blocking).

---

## Required Changes

| ID | Severity | File | Fix |
|----|----------|------|-----|
| HIGH-01 | HIGH | `trainer-xp-distribute.post.ts` | Add `loadEncounter(encounterId)` call to validate encounter exists |
| HIGH-02 | HIGH | `app-surface.md` | Document new endpoint, 2 components, store action, utility mapping |
| MEDIUM-01 | MEDIUM | `XpDistributionModal.vue` | Store and display trainer XP distribution results; handle partial failure gracefully |
| MEDIUM-02 | MEDIUM | `XpDistributionModal.vue` | Fetch fresh trainerXp/level data instead of reading stale combatant entity snapshot |
| MEDIUM-03 | MEDIUM | (new ticket) | File refactoring ticket for XpDistributionModal.vue exceeding 800 lines |
