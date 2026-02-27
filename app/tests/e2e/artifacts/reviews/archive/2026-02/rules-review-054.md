# Rules Review 054 — bug-014: Breather removes Cursed without checking source

**Ticket:** bug-014
**Commit:** 189c830
**File changed:** `app/server/api/encounters/[id]/breather.post.ts`
**Reviewer:** Game Logic Reviewer
**Date:** 2026-02-20
**Verdict:** PASS

---

## PTU Rule Under Review

**Take a Breather** (PTU 1.05, p.245):

> When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions. To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters at the end of the Shift triggered by Take a Breather.

**Cursed condition** (PTU 1.05, p.245 volatile status list):

> Cursed: If a Cursed Target takes a Standard Action, they lose two ticks of Hit Points at the end of that turn.

**Key rule:** Cursed is a volatile condition but has a unique conditional prerequisite for removal via Breather: the curse source must be KO'd or more than 12 meters (6 squares) away. No other volatile condition has a similar prerequisite.

---

## Code Change Analysis

### Before (broken)
```typescript
const BREATHER_CURED_CONDITIONS: StatusCondition[] = [
  ...VOLATILE_CONDITIONS,
  'Slowed',
  'Stuck'
]
```

`VOLATILE_CONDITIONS` includes `'Cursed'`, so Breather unconditionally removed it.

### After (fixed)
```typescript
const BREATHER_CURED_CONDITIONS: StatusCondition[] = [
  ...VOLATILE_CONDITIONS.filter(c => c !== 'Cursed'),
  'Slowed',
  'Stuck'
]
```

Cursed is filtered out of the Breather cure list. It remains in `VOLATILE_CONDITIONS` (correctly -- it IS volatile for all other purposes like capture rate and fainting auto-clear).

---

## Verification Checklist

### 1. Is the Cursed exclusion correct per PTU rules?
**YES.** The rulebook explicitly states that Cursed removal via Breather requires the curse source to be KO'd or >12m away. The app does not track curse sources (no `curseSourceId` field exists on any model). Without source tracking, the app cannot evaluate the prerequisite. Excluding Cursed from auto-clear is the conservative correct interpretation: it is strictly better to leave Cursed active (requiring GM manual removal when the condition is met) than to remove it incorrectly (which would trivialize the Curse mechanic).

### 2. Do any other volatile conditions have conditional removal prerequisites?
**NO.** I reviewed every volatile condition's definition in PTU 1.05 p.245:

| Condition | Breather Removal | Special Prerequisites |
|-----------|-----------------|----------------------|
| Asleep | Unconditional | None |
| Confused | Unconditional | None |
| Flinched | Unconditional | None (expires end-of-round anyway) |
| Infatuated | Unconditional | None |
| **Cursed** | **Conditional** | **Source KO'd or >12m away** |
| Disabled | Unconditional | None |
| Enraged | Unconditional | None |
| Suppressed | Unconditional | None |

Cursed is the only volatile condition with a conditional removal rule. No other conditions need similar exclusion.

### 3. Is Cursed still correctly categorized as volatile?
**YES.** `VOLATILE_CONDITIONS` in `app/constants/statusConditions.ts` still includes `'Cursed'`. This is correct because:
- Cursed IS a volatile condition per PTU rules (listed in the Volatile Status Afflictions section)
- Fainting auto-clears all volatile conditions including Cursed (p.245: "When Pokemon are Fainted, they are automatically cured of all Volatile Status Afflictions") -- no source check needed
- Capture rate calculations correctly count Cursed as volatile
- Only the Breather path has the conditional removal rule

### 4. Are there duplicate code paths?
**NO.** Searched entire codebase for Breather/Cursed clearing logic. Only one implementation exists: `app/server/api/encounters/[id]/breather.post.ts`. The client store (`encounterCombat.ts:takeABreather`) is a thin API caller that delegates entirely to this endpoint.

### 5. Are the comments accurate?
**YES.** The file header comment, inline comments, and commit message all correctly reference p.245, the conditional rule, and the rationale for exclusion.

### 6. Does the Slowed/Stuck inclusion remain correct?
**YES.** PTU p.245 explicitly says Breather cures "the Slow and Stuck conditions." These are not volatile conditions (they are in `OTHER_CONDITIONS`) but are specifically called out by the Breather rules. No conditional prerequisites apply to their removal via Breather.

---

## Potential Future Enhancement

If curse source tracking is ever added (e.g., a `curseSourceId` field on the entity), the Breather endpoint could be updated to conditionally remove Cursed by checking:
1. Is the source combatant KO'd (fainted)?
2. Is the source combatant more than 12 meters (6 grid squares) from the cursed target?

Until then, GM manual removal is the correct fallback.

---

## Result

**PASS** -- The fix correctly implements PTU 1.05 p.245 Cursed removal rules. The conservative approach (exclude from auto-clear, defer to GM) is the right call given the app's current data model. No other volatile conditions require similar treatment.
