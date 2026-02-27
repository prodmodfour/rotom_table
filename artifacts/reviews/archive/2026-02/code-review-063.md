---
review_id: code-review-063
ticket_id: bug-014
commits: [189c830]
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
---

## Review: bug-014 — Breather removes Cursed without checking source prerequisite

### Commit Reviewed
- `189c830` -- fix: exclude Cursed from breather auto-clear list

### Files Changed
- `app/server/api/encounters/[id]/breather.post.ts` (+5 -2)

---

### Fix Analysis

**Root cause confirmed.** `BREATHER_CURED_CONDITIONS` spread all of `VOLATILE_CONDITIONS` (which includes Cursed) without any conditional check. PTU 1.05 p.245 requires the curse source to be KO'd or >12m away before Cursed can be removed by Take a Breather. Since the app does not track curse sources, the prerequisite could never be verified.

**Fix is correct and minimal.** The change at line 20:
```ts
...VOLATILE_CONDITIONS.filter(c => c !== 'Cursed'),
```
This excludes only `Cursed` from the spread. Verified `VOLATILE_CONDITIONS` in `constants/statusConditions.ts:11-13` contains 8 entries: Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed. After the filter, 7 remain in `BREATHER_CURED_CONDITIONS`, plus Slowed and Stuck = 9 total curable conditions.

**No collateral damage.** `Cursed` remains in the canonical `VOLATILE_CONDITIONS` array (`statusConditions.ts:12`) and in the `StatusCondition` type union (`types/combat.ts:6`). The filter is scoped exclusively to `BREATHER_CURED_CONDITIONS`. Other consumers of `VOLATILE_CONDITIONS` -- capture rate calculation (`captureRate.ts:116`), capture composable (`useCapture.ts:148`), GM action modal (`GMActionModal.vue:259`) -- are unaffected.

**Duplicate code path check: PASS.** Searched the entire `app/` tree:
- **Server:** Only `breather.post.ts` contains condition-clearing logic.
- **Client store:** `encounterCombat.ts:116-121` `takeABreather()` is a thin `$fetch` wrapper that delegates entirely to the server endpoint. No client-side condition manipulation.
- **Composable:** `useEncounterActions.ts:140-143` calls the store method. No independent clearing.
- **useRestHealing.ts:** No breather or Cursed references (handles rest/sleep mechanics, not combat breather).

Single implementation confirmed.

**Rule interpretation verified against PTU source text.** PTU 1.05 p.245: "To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters at the end of the Shift triggered by Take a Breather." Without curse source tracking, excluding Cursed entirely and requiring GM manual removal is the most rules-accurate approach.

**Documentation quality.** The commit touches three documentation points:
1. File header doc-comment (line 5): added "(except Cursed -- requires GM adjudication)"
2. Inline multi-line comment (lines 15-18): explains the exception, references page number, states the trade-off
3. Commit message body: references PTU p.245, explains the tracking limitation

All accurate.

---

### What Looks Good

1. **Surgical change.** 1 file, 5 lines added, 2 removed. The filter is the minimal correct fix.
2. **No mutation of shared constants.** `VOLATILE_CONDITIONS` is untouched; the filter creates a new array.
3. **Complete fix-log in ticket.** bug-014.md documents the root cause, fix, file changed, and duplicate check.
4. **Sound design decision.** Excluding entirely is safer than attempting partial tracking that could be wrong.

---

### Issues

#### MEDIUM: No E2E test verifies Cursed survives breather

Existing tests (`combat-take-a-breather-001.spec.ts`, `healing-breather-effects-001.spec.ts`) test volatile clearing with Confused, Enraged, and Suppressed, but none apply Cursed and verify it persists after breather. Without a regression test, the bug could be silently reintroduced.

**Action:** Filed as bug-028 -- E2E test for Cursed exclusion from breather auto-clearing.

---

### Verdict: APPROVED

The fix correctly addresses bug-014. The approach of excluding Cursed from auto-clearing (rather than implementing incomplete source tracking) is the right trade-off. The missing regression test is filed as bug-028 and does not block approval.
