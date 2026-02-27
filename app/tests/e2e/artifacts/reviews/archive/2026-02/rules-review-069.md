---
review_id: rules-review-069
trigger: orchestrator-routed
target_tickets: [ptu-rule-052, ptu-rule-053]
reviewed_commits: []
verdict: APPROVED_WITH_NOTES
reviewed_at: 2026-02-20T12:00:00Z
reviewer: game-logic-reviewer
---

## Scope

Batch D review covering two tickets:

1. **ptu-rule-052** -- Extended Rest daily move refresh rolling window. Verify that `isDailyMoveRefreshable()` correctly implements the PTU wording for when Daily-Frequency Moves can be regained.

2. **ptu-rule-053** -- Bound AP tracking. Verify the formula `available AP = max AP - bound AP - drained AP`, scene-end AP behavior, Extended Rest AP clearing, and New Day AP reset.

## Mechanics Verified

### ptu-rule-052: Daily Move Refresh Rolling Window

#### 1. PTU Rule Text (Core p.252)

> "Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP. Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."

The key phrase: **"if the Move hasn't been used since the previous day."**

This means: if a move was used **today**, it cannot be refreshed by tonight's Extended Rest. Only moves whose last usage was **yesterday or earlier** are eligible for refresh. A move that has never been used is always eligible.

#### 2. `isDailyMoveRefreshable()` in `app/utils/restHealing.ts` (lines 207-212) -- CORRECT

```typescript
export function isDailyMoveRefreshable(lastUsedAt: string | null | undefined): boolean {
  if (!lastUsedAt) return true // No usage record -> eligible
  const usedDate = new Date(lastUsedAt)
  const today = new Date()
  return usedDate.toDateString() !== today.toDateString()
}
```

- `null`/`undefined` -> returns `true` (never used = eligible). **CORRECT.**
- Compares `usedDate.toDateString()` vs `today.toDateString()`. If same calendar day -> `false` (used today, not eligible). If different day -> `true` (used before today, eligible). **CORRECT per PTU wording.**
- The comment accurately cites "PTU Core p.252" and explains the rolling window logic.

#### 3. Pokemon Extended Rest endpoint `app/server/api/pokemon/[id]/extended-rest.post.ts` (lines 74-103) -- CORRECT

The endpoint correctly applies the rolling window:

```typescript
if (isDailyMove && move.usedToday && move.usedToday > 0) {
  if (isDailyMoveRefreshable(move.lastUsedAt)) {
    restoredMoves.push(move.name)
    move.usedToday = 0
    move.lastUsedAt = undefined
  } else {
    skippedMoves.push(move.name)
  }
}
```

- Only daily moves with `usedToday > 0` are candidates for refresh.
- `isDailyMoveRefreshable(move.lastUsedAt)` gates whether the move qualifies.
- Refreshed moves get `usedToday = 0` and `lastUsedAt = undefined`.
- Skipped moves remain with their current usage tracking.
- Non-daily moves are also reset (line 93-97) -- this is a reasonable choice since non-daily frequency moves (At-Will, Scene, EOT) do not have the "previous day" restriction.
- Scene usage is also cleared for refreshed daily moves (line 99-103) -- correct since the Extended Rest implies a scene boundary.

**Response includes `restoredMoves` and `skippedMoves` arrays** in the return data, allowing the UI to inform the GM which moves were and weren't refreshed. Good UX.

**CORRECT -- matches PTU 1.05 rules exactly.**

#### 4. Note on "previous day" interpretation

The PTU text says "since the previous day" which could theoretically be interpreted two ways:
- (A) Calendar day boundary: used today = not refreshable tonight (the implementation's approach)
- (B) 24-hour rolling window: used within the last 24 hours = not refreshable

Interpretation (A) is the standard and correct reading in the TTRPG community. "Since the previous day" means "since the last calendar day change." The implementation correctly uses `toDateString()` comparison for calendar day boundary checking. **CORRECT.**

### ptu-rule-053: Bound AP Tracking

#### 1. PTU Rule Text (Core p.221-222, Playing the Game)

> "Action Points are completely regained at the end of each Scene. However, some effects may Bind or Drain Action Points. Bound Action Points remain off-limits until the effect that Bound them ends, as specified by the Feature or effect. If no means of ending the effect is specified, then the effect may be ended and AP Unbound during your turn as a Free Action. Drained AP becomes unavailable for use until after an Extended Rest is taken."

Additional context from the [Stratagem] tag (Core p.60):

> "[Stratagem] Features are special Orders which are activated once and then have a persistent effect while AP is Bound. [Stratagem] Features may only be Bound during combat and automatically Unbind when combat ends."

#### 2. `calculateAvailableAp()` in `app/utils/restHealing.ts` (lines 230-232) -- CORRECT

```typescript
export function calculateAvailableAp(maxAp: number, boundAp: number, drainedAp: number): number {
  return Math.max(0, maxAp - boundAp - drainedAp)
}
```

Per PTU: Bound AP is "off-limits" and Drained AP is "unavailable." Available = max - bound - drained. The `Math.max(0, ...)` prevents negative values. **CORRECT.**

#### 3. `calculateMaxAp()` in `app/utils/restHealing.ts` (lines 219-221) -- CORRECT

```typescript
export function calculateMaxAp(level: number): number {
  return 5 + Math.floor(level / 5)
}
```

Per PTU Core p.221: "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels." Level 1 = 5, Level 5 = 6, Level 10 = 7, Level 15 = 8. `Math.floor(level / 5)` gives: L1=0, L5=1, L10=2, L15=3. So: L1=5, L5=6, L10=7, L15=8. **CORRECT.**

#### 4. Scene-End AP: `app/server/api/scenes/[id]/deactivate.post.ts` (lines 31-58) -- CORRECT WITH NOTE

The code clears bound AP and restores current AP:

```typescript
// Scene end: unbind all bound AP and restore to max minus drained
const restoredAp = calculateSceneEndAp(char.level, char.drainedAp)
await prisma.humanCharacter.update({
  where: { id: char.id },
  data: {
    boundAp: 0, // All binding effects end at scene close
    currentAp: restoredAp
  }
})
```

And `calculateSceneEndAp()` is:
```typescript
export function calculateSceneEndAp(level: number, drainedAp: number, boundAp: number = 0): number {
  const maxAp = calculateMaxAp(level)
  return calculateAvailableAp(maxAp, boundAp, drainedAp)
}
```

Analysis against PTU rules:

- **"AP is completely regained at the end of each Scene"** -- The code sets `currentAp = maxAp - drainedAp` (since boundAp=0 after clearing). This means all non-drained AP is restored. **CORRECT.**
- **"Drained AP becomes unavailable for use until after an Extended Rest"** -- The code preserves `drainedAp` (does not reset it). Only `currentAp` is recalculated around it. **CORRECT.**
- **Bound AP cleared at scene end** -- `boundAp: 0`. The comment says "All binding effects end at scene close." Per the [Stratagem] tag: "automatically Unbind when combat ends." The more general Bound AP rule says "Bound Action Points remain off-limits until the effect that Bound them ends." The code assumes all binding effects end at scene end, which is correct for Stratagems (the most common source of Bound AP) and is a reasonable simplification for scene-end processing.

**NOTE:** Technically, some non-Stratagem Bound AP effects could persist across scenes if their Feature specifies a different unbinding condition. However, in practice, Stratagems are the primary source of Bound AP and they explicitly unbind when combat ends. A scene deactivation is at least as significant as combat ending. This is an acceptable simplification. A more precise implementation would track individual binding effects, but that level of granularity is beyond what any PTU digital tool typically handles.

**CORRECT -- reasonable interpretation for a digital tool.**

#### 5. Extended Rest AP: `app/server/api/characters/[id]/extended-rest.post.ts` (lines 74-91) -- ISSUE FOUND

```typescript
// Restore drained AP and clear bound AP, set currentAp to full max
const apRestored = character.drainedAp
const boundApCleared = character.boundAp
const maxAp = calculateMaxAp(character.level)

const updated = await prisma.humanCharacter.update({
  where: { id },
  data: {
    ...
    drainedAp: 0,  // Restore all drained AP
    boundAp: 0,    // Clear all bound AP (binding effects end)
    currentAp: maxAp // Full AP pool since drained and bound are now 0
  }
})
```

**Drained AP clearing: CORRECT.** PTU Core p.252: "restore a Trainer's Drained AP." The code sets `drainedAp: 0`.

**Bound AP clearing: ACCEPTABLE.** The PTU rules say Bound AP remains until "the effect that Bound them ends." Extended Rest is 4+ hours of non-rigorous activity. Since Stratagems (the primary binder) "automatically Unbind when combat ends" and an Extended Rest implies no active combat, clearing bound AP is logically consistent. Furthermore, any non-Stratagem bound effect that persisted through a 4+ hour rest would be an edge case not worth tracking in a digital tool.

**currentAp set to maxAp: CORRECT.** Since both drainedAp and boundAp are 0, available = max - 0 - 0 = max. This is the correct final value.

**Errata note (errata-2.md, Nurse Feature):** The Nurse feature says "The AP Drain cost from triggering this Feature is applied after the Extended Rest is completed and AP Drain has otherwise been restored." This means the Extended Rest restores drained AP first, then the Nurse feature drains 2 AP. The current code does not implement the Nurse feature, so this is not a current concern, but it establishes that the "restore drained AP" ordering is important. No issue for current code.

**CORRECT.**

#### 6. New Day AP: `app/server/api/game/new-day.post.ts` (lines 23-36) -- CORRECT

```typescript
for (const char of characters) {
  const maxAp = calculateMaxAp(char.level)
  await prisma.humanCharacter.update({
    where: { id: char.id },
    data: {
      restMinutesToday: 0,
      injuriesHealedToday: 0,
      drainedAp: 0,
      boundAp: 0,
      currentAp: maxAp,
      lastRestReset: now
    }
  })
}
```

PTU does not explicitly define a "New Day" reset for AP independent of Extended Rest. However, a new in-game day logically implies rest occurred (players typically rest overnight). The code resets all AP tracking to fresh state. This is a reasonable GM convenience feature that goes beyond the rules but does not contradict them. A new day should leave trainers with full AP.

The per-character individual endpoint `app/server/api/characters/[id]/new-day.post.ts` does the same thing identically. **Both endpoints are consistent.**

**CORRECT -- reasonable GM tool behavior.**

#### 7. Cross-check: `calculateSceneEndAp()` default parameter

```typescript
export function calculateSceneEndAp(level: number, drainedAp: number, boundAp: number = 0): number {
```

The `boundAp` parameter defaults to 0. The scene deactivation endpoint calls it as `calculateSceneEndAp(char.level, char.drainedAp)` -- omitting boundAp. Since the deactivation code sets `boundAp: 0` in the DB update separately, and the function calculates `maxAp - boundAp(0) - drainedAp`, the result is `maxAp - drainedAp`. This is correct: all non-drained AP is available after scene end.

**CORRECT.**

## Issues Found

### MEDIUM: Comment inaccuracy in scene deactivation (cosmetic, not functional)

**File:** `app/server/api/scenes/[id]/deactivate.post.ts`, lines 31-34

```typescript
// Restore AP for all characters in the scene (PTU Core p221:
// "Action Points are completely regained at the end of each Scene.
//  Drained AP remains unavailable until Extended Rest.
//  Bound AP is released at scene end (Stratagems auto-unbind).")
```

The third line ("Bound AP is released at scene end (Stratagems auto-unbind)") is presented as a direct quote from PTU Core p.221, but the actual text on p.221 does not say this. The p.221 text says: "Bound Action Points remain off-limits until the effect that Bound them ends." The Stratagem auto-unbind rule is from the [Stratagem] tag on p.60: "[Stratagem] Features... automatically Unbind when combat ends."

The code behavior is correct (clearing boundAp at scene end is reasonable), but the comment misattributes the source. The closing quotation mark makes it look like all three lines are direct quotes from p.221 when the third line is a paraphrase combining p.221 and p.60 concepts.

**Impact:** Zero functional impact. Comment-only inaccuracy. A developer reading this might incorrectly cite p.221 as the source for the Stratagem unbinding rule.

**Suggested fix:** Separate the direct quote from the implementation note:
```typescript
// Restore AP for all characters in the scene
// PTU Core p.221: "Action Points are completely regained at the end of each Scene."
// PTU Core p.221: "Drained AP becomes unavailable for use until after an Extended Rest."
// Implementation note: Bound AP cleared at scene end (Stratagems auto-unbind per p.60)
```

## Verdict

**APPROVED_WITH_NOTES**

Both tickets implement their PTU mechanics correctly:

- **ptu-rule-052**: The `isDailyMoveRefreshable()` function correctly implements the PTU p.252 rolling window: "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day." Calendar day boundary comparison via `toDateString()` is the standard interpretation. The Pokemon Extended Rest endpoint correctly gates daily move refresh through this function, skipping moves used today and restoring moves used on previous days.

- **ptu-rule-053**: The `calculateAvailableAp()` formula (`max - bound - drained`) is correct per PTU p.221. Scene-end behavior correctly restores all non-drained AP and clears bound AP. Extended Rest correctly clears both drained and bound AP, restoring the full AP pool. New Day correctly resets all AP tracking. The `calculateMaxAp()` formula (`5 + floor(level/5)`) matches PTU p.221 exactly.

The one note is a comment accuracy issue in the scene deactivation endpoint that misattributes a paraphrased rule as a direct PTU quote. No functional impact -- all game mechanics are correctly implemented.
