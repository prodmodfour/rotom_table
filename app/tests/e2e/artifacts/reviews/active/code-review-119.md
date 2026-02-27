---
review_id: code-review-119
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: design-xp-system-001
domain: pokemon-lifecycle
commits_reviewed:
  - 5a388a4
  - 8119970
  - 79fc199
  - ebb1706
  - b078693
  - ad5c421
files_reviewed:
  - app/prisma/schema.prisma
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/types/encounter.ts
  - app/stores/encounter.ts
  - app/components/encounter/XpDistributionModal.vue
  - app/pages/gm/index.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 3
  medium: 1
scenarios_to_rerun: []
reviewed_at: 2026-02-20T18:00:00Z
---

## Review Scope

P1 implementation of design-xp-system-001 (ptu-rule-055): post-combat XP Distribution UI. Six commits adding the `xpDistributed` safety flag, store actions, `XpDistributionModal` component, and end-encounter integration.

## Status Table

| Deliverable | Plan | Actual | Status |
|---|---|---|---|
| `xpDistributed` Prisma column | Boolean @default(false) | Boolean @default(false) | Done |
| `xpDistributed` in encounter service | Add to EncounterRecord, ParsedEncounter, buildEncounterResponse | Added to all three | Done |
| `xpDistributed` in client type | Add to Encounter interface | Added as optional | Done |
| `xpDistributed` set after distribution | Set true in xp-distribute endpoint | Set true after Promise.all | Done |
| Store actions: calculateXp, distributeXp | Thin wrappers around API | Implemented, properly typed | Done |
| XpDistributionModal | Full modal with config, distribution, results phases | Implemented with all features | Done |
| End-encounter integration | Replace confirm() when defeatedEnemies > 0 | Integrated with skip/complete/close handlers | Done |
| Per-player XP validation | Prevent over-allocation per player | Client-side validation with per-player remaining display | Done |
| Split Evenly button | Per-player split | Implemented with remainder to first Pokemon | Done |
| Level-up preview | Inline preview in distribution phase | Implemented using getLevelForXp | Done |
| Results phase | Show XP gains, level-ups, new moves/abilities | Implemented with full level-up detail breakdown | Done |
| xpDistributed warning banner | Show on re-distribution | Implemented | Done |

## Issues

### HIGH

**H1: Double API call on preset change — `handlePresetChange` + watcher both fire**

`XpDistributionModal.vue:463,549`

When the GM changes the significance preset dropdown, two things happen:
1. `@change="handlePresetChange"` fires and calls `recalculate()` (line 467)
2. `selectedPreset` changes, which updates `effectiveMultiplier` (computed), which triggers `watch(effectiveMultiplier, () => recalculate())` (line 549)

Both call `recalculate()`, producing two concurrent API calls. The second response may overwrite the first, or if the responses arrive out of order, the UI will show stale data.

```vue
<!-- Line 51-57: @change fires handlePresetChange -->
<select v-model="selectedPreset" @change="handlePresetChange">

<!-- Line 463-467: handlePresetChange calls recalculate() directly -->
const handlePresetChange = () => {
  if (selectedPreset.value !== 'custom') {
    recalculate()
  }
}

<!-- Line 549: watcher ALSO calls recalculate() when effectiveMultiplier changes -->
watch(effectiveMultiplier, () => recalculate())
```

**Fix:** Remove `handlePresetChange` entirely and remove `@change="handlePresetChange"` from the select element. The watcher on `effectiveMultiplier` already covers this case. The `handlePresetChange` guard (`if !== 'custom'`) is unnecessary because switching to 'custom' doesn't change `effectiveMultiplier` until `customMultiplier` changes, and that has its own watcher (line 552).

---

**H2: Double API call on mount when detected player count differs from default**

`XpDistributionModal.vue:557-561`

The `onMounted` sets `playerCount.value = detectedPlayerCount.value` then calls `recalculate()`. But the `watch(playerCount)` watcher (line 550) fires asynchronously after the value changes from `1` to the detected value. After the awaited `recalculate()` completes, Vue flushes the watcher queue and calls `recalculate()` a second time with the same value.

```typescript
// Line 557-561
onMounted(async () => {
  playerCount.value = detectedPlayerCount.value  // triggers watcher
  await recalculate()  // first call
})
// After await completes, Vue flushes: watch(playerCount) fires -> second call
```

**Fix:** Add a guard flag to suppress watcher-triggered recalculations during initialization:

```typescript
const initialized = ref(false)

watch(effectiveMultiplier, () => { if (initialized.value) recalculate() })
watch(playerCount, () => { if (initialized.value) recalculate() })
watch(isBossEncounter, () => { if (initialized.value) recalculate() })
watch(customMultiplier, () => {
  if (initialized.value && selectedPreset.value === 'custom') recalculate()
})

onMounted(async () => {
  playerCount.value = detectedPlayerCount.value
  await recalculate()
  initialized.value = true
})
```

This also prevents any other watcher from firing during mount (e.g., if default values for `isBossEncounter` or `effectiveMultiplier` happen to trigger).

---

**H3: No request cancellation on rapid parameter changes — stale response can overwrite fresh one**

`XpDistributionModal.vue:470-497`

Even after fixing H1 and H2, the GM can still trigger multiple `recalculate()` calls by changing parameters faster than the API responds (e.g., typing in the player count field: 1 -> 12 -> 3 fires three API calls). If response for "12" arrives after response for "3", the UI shows the wrong data.

The `isCalculating` flag is set but not checked before updating state, and there is no request version counter or AbortController.

```typescript
const recalculate = async () => {
  isCalculating.value = true
  calculationError.value = null
  try {
    const result = await encounterStore.calculateXp({ ... })
    calculationResult.value = result  // <-- could be stale if a newer request finished first
  } catch ...
}
```

**Fix:** Add a request counter. Only apply the result if it matches the latest request:

```typescript
let requestVersion = 0

const recalculate = async () => {
  const thisRequest = ++requestVersion
  isCalculating.value = true
  calculationError.value = null

  try {
    const result = await encounterStore.calculateXp({
      significanceMultiplier: effectiveMultiplier.value,
      playerCount: playerCount.value,
      isBossEncounter: isBossEncounter.value
    })

    // Only apply if this is still the latest request
    if (thisRequest !== requestVersion) return

    calculationResult.value = result
    // ... rest of allocation initialization
  } catch (e: unknown) {
    if (thisRequest !== requestVersion) return
    const message = e instanceof Error ? e.message : 'Failed to calculate XP'
    calculationError.value = message
  } finally {
    if (thisRequest === requestVersion) {
      isCalculating.value = false
    }
  }
}
```

### MEDIUM

**M1: File size — 1053 lines exceeds the 800-line project limit**

`XpDistributionModal.vue`

The file is 1053 lines: template (271), script (290), SCSS (490). The template and script are well within bounds at 561 lines combined, but the SCSS pushes it over. The largest existing modal (`GMActionModal.vue`) is 783 lines.

**Fix:** Extract the SCSS into a dedicated partial file `app/assets/scss/components/_xp-distribution-modal.scss` and import it. This keeps the SFC focused on behavior and brings it under 600 lines. Alternatively, extract some of the reusable form styles (`.form-select`, `.form-input--sm`, `.toggle`) into shared SCSS partials if they aren't already defined globally.

## What Looks Good

1. **Clean separation of phases.** The `configure` / `results` phase pattern is clear and easy to follow. The template conditionals are straightforward.

2. **Per-player validation.** The `getPlayerRemaining()` function correctly groups Pokemon by owner and prevents over-allocation. This directly addresses the M1 gap from code-review-117.

3. **Immutable Map updates.** `handleXpInput` and `splitEvenly` both create new Map instances rather than mutating the reactive Map in place. This follows the project's immutability standard.

4. **Safety flag integration.** The `xpDistributed` boolean flows correctly: set server-side in `xp-distribute.post.ts`, included in `buildEncounterResponse`, read client-side via `encounter.xpDistributed`, and displayed as a warning banner.

5. **Split Evenly with remainder handling.** The floor division + remainder-to-first-Pokemon approach is correct and prevents fractional XP.

6. **End-encounter integration.** The three-path flow (skip, complete, close) is well-designed. Skip and complete both proceed to end the encounter, while close leaves the encounter active.

7. **Commit granularity.** Six focused commits, each with a clear scope. The fix commit (b078693) correctly identified the double-fetch issue from the original implementation.

8. **Design spec adherence.** All P1 deliverables from design-xp-system-001 section D are implemented. Player count auto-detection, preset + custom multiplier, boss toggle, per-player distribution, level-up preview, results summary, and xpDistributed warning are all present.

## Recommended Next Steps

1. Fix H1 (remove `handlePresetChange` and `@change` handler) -- trivial, 5 lines removed.
2. Fix H2 (add `initialized` guard flag to watchers) -- straightforward, 10 lines changed.
3. Fix H3 (add request version counter to `recalculate`) -- small addition, prevents race condition.
4. Fix M1 (extract SCSS to partial) -- mechanical, brings file under limit.
