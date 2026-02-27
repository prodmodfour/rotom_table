---
review_id: rules-review-071
trigger: orchestrator-routed
target_tickets: [ptu-rule-061]
reviewed_commits: [264a8b2, e1a6fbf, b968b51, ffec1d0, 642c5b6, 1d7f1e6, 02bd536, f581667, 22ff4ae, 2fcb5d9]
verdict: APPROVED_WITH_NOTES
reviewed_at: 2026-02-20T00:00:00Z
reviewer: game-logic-reviewer
---

## Scope

Weather duration counter with auto-expiration for encounters. This review covers:
- `app/server/api/encounters/[id]/weather.post.ts` — weather setting endpoint
- `app/server/api/encounters/[id]/next-turn.post.ts` — round-end decrement logic
- `app/components/gm/EncounterHeader.vue` — weather UI options and display
- `app/stores/encounter.ts` — setWeather store action
- `app/prisma/schema.prisma` — weather field definitions

## PTU Rules Referenced

### Weather Keyword Definition (p.341)
> "Moves with the Weather keyword affects an area, changing the rules of the battle. Damage can be altered and even the Effects of moves can change depending on the Weather in battle. **There can only be one Weather Effect in place at a time; new Weather Effects replace old Weather Effects. Weather Conditions last 5 rounds.**"

### Four PTU Weather Conditions (p.342)
1. **Hail** — non-Ice types lose a Tick of HP at beginning of turn
2. **Rainy** — Water +5 damage, Fire -5 damage
3. **Sandstorm** — non-Ground/Rock/Steel types lose a Tick of HP at beginning of turn
4. **Sunny** — Fire +5 damage, Water -5 damage

### Weather Moves (all "5 rounds")
- **Sunny Day** (p.377): "The weather becomes Sunny for 5 rounds."
- **Rain Dance** (p.434): "The weather becomes Rainy for 5 rounds."
- **Sandstorm** (p.417): "The weather changes to a Sandstorm for 5 rounds."
- **Hail** (p.389): "The weather changes to Hail for 5 rounds."
- **Defog** (p.374): "The Weather becomes Clear, and all Blessings, Coats, and Hazards are destroyed. Clear Weather is the default weather, conferring no innate bonuses or penalties of any sort."

### Weather Abilities (all "5 rounds")
- **Drought** (p.314): "The Weather changes to be Sunny for 5 rounds."
- **Drizzle** (p.314): "The Weather changes to be Rainy for 5 rounds."
- **Sand Stream** (p.330): "The Weather changes to a Sandstorm for 5 rounds."
- **Snow Warning** (p.332): "The Weather changes to Hail for 5 rounds."
- **Air Lock** (p.307): "The weather is set to normal as long as the Pokemon with Air Lock wants it to remain that way."
- **Cloud Nine** (p.310): "The weather of the field is set to normal."

## Mechanics Verified

### 1. Weather Duration (5 rounds) -- PASS
PTU explicitly states weather lasts 5 rounds in all four weather move descriptions and the general Weather keyword definition. The implementation uses `PTU_WEATHER_DURATION = 5` in `weather.post.ts` (line 14), correctly applied when source is `'move'` or `'ability'` (line 40-42).

### 2. Ability-Based Weather Duration -- APPROVED WITH NOTE
**PTU rule:** Drought, Drizzle, Sand Stream, and Snow Warning all explicitly state "for 5 rounds" — they are NOT persistent while the ability user is active. The ticket description assumed ability weather persists while active, but the actual PTU 1.05 text gives all four abilities an explicit 5-round duration identical to moves.

**Implementation:** The endpoint treats `source === 'ability'` identically to `source === 'move'` (both get 5 rounds), which is **correct per PTU 1.05 rules**. The endpoint comment on line 8 ("Weather from abilities persists while the ability user is active") is misleading — it describes the video game mechanic, not the PTU tabletop mechanic. However, the actual code logic is correct because both branches use `PTU_WEATHER_DURATION`.

**Air Lock and Cloud Nine** are different — they set weather to "normal" (Clear) rather than creating a timed weather condition. These aren't directly handled by the weather system but would be expressed as setting weather to `null` through the manual interface, which works correctly.

### 3. Weather Auto-Clear on Expiration -- PASS
In `next-turn.post.ts` (lines 72-80), when `weatherDuration` decrements to 0:
- `weather` is set to `null` (not "Clear")
- `weatherDuration` is set to `0`
- `weatherSource` is set to `null`

This is functionally correct. PTU describes "Clear" as "the default weather, conferring no innate bonuses or penalties" (Defog description). Setting weather to `null` is semantically equivalent to "no weather effect active," which matches PTU's concept of Clear/normal weather.

### 4. Weather Decrement Timing -- PASS
The decrement happens at the end of each round (line 58-81 in `next-turn.post.ts`), specifically when `currentTurnIndex >= turnOrder.length` triggers a new round. PTU does not specify whether weather decrements at round start or round end — the rules simply say weather "lasts 5 rounds." The implementation counts down one per full round cycle, meaning weather set in round 1 expires at the end of round 5 (5 full rounds of effect). This is a reasonable interpretation.

### 5. Weather Overwriting -- PASS
PTU explicitly states: "new Weather Effects replace old Weather Effects." The `weather.post.ts` endpoint unconditionally overwrites the existing weather with whatever new value is provided (lines 47-54), including overwriting an active weather mid-duration. This matches the PTU rule.

### 6. Manual Weather (Indefinite) -- PASS
The `source === 'manual'` path correctly sets `duration = 0` (line 44), and the decrement logic in `next-turn.post.ts` skips decrement when `weatherSource !== 'manual'` is false (line 72). This allows GMs to set permanent weather for narrative purposes without auto-expiration, which is an appropriate GM tool.

### 7. Weather Types in UI -- APPROVED WITH NOTES

**PTU Core Weather (4 types):**
| PTU Name | App Value | Match? |
|----------|-----------|--------|
| Sunny | `sunny` | PASS |
| Rainy | `rain` | PASS (cosmetic naming difference; "rain" vs "rainy" is acceptable shorthand) |
| Sandstorm | `sandstorm` | PASS |
| Hail | `hail` | PASS |

**Extra Weather Types in App (5 additional):**
| App Value | PTU Status |
|-----------|------------|
| `snow` | NOT in PTU 1.05. This is a Gen 9 mechanic (Scarlet/Violet). PTU 1.05 only has Hail for ice weather. |
| `fog` | NOT a standard PTU weather condition. The rulebook mentions "foggy weather" in passing (Weather Ball description, p.342) but does not define Fog as a formal Weather Condition. Some GMs may use it narratively. |
| `harsh_sunlight` | NOT in PTU 1.05. This is a Gen 6 "Primal Weather" mechanic (Desolate Land). |
| `heavy_rain` | NOT in PTU 1.05. This is a Gen 6 "Primal Weather" mechanic (Primordial Sea). |
| `strong_winds` | NOT in PTU 1.05. This is a Gen 6 "Primal Weather" mechanic (Delta Stream). |

These 5 extra weather types are not harmful — they serve as GM convenience options for edge cases or homebrew — but they have no mechanical effects defined in PTU 1.05. The GM should be aware they are non-standard.

## Issues Found

### MEDIUM: Misleading Comment About Ability Weather Persistence
**File:** `app/server/api/encounters/[id]/weather.post.ts`, line 8
**Current:** `* Weather from abilities persists while the ability user is active.`
**Problem:** This describes video game behavior, not PTU 1.05 rules. In PTU 1.05, all four weather abilities (Drought, Drizzle, Sand Stream, Snow Warning) explicitly state "for 5 rounds."
**Impact:** Misleading to future developers who read the comment and may try to implement persistent ability weather. The actual code logic is correct (both `'move'` and `'ability'` get 5 rounds), so this is a documentation issue only.
**Suggested fix:** Change to: `* Weather from abilities lasts 5 rounds (same as moves per PTU 1.05).`

### LOW: Extra Weather Types Lack Mechanical Definitions
**File:** `app/components/gm/EncounterHeader.vue`, lines 43-48
**Types:** `snow`, `fog`, `harsh_sunlight`, `heavy_rain`, `strong_winds`
**Problem:** These have no defined PTU 1.05 mechanical effects. Including them in the dropdown without any indication they are non-standard could confuse a GM who expects mechanical automation.
**Impact:** Low. These are convenience options and cause no functional harm. No mechanical effects are triggered by any weather value — the current system is purely a tracker/label.
**Suggested fix (optional):** Consider grouping the dropdown with an `<optgroup label="PTU Standard">` for the 4 core types and `<optgroup label="Extended / Homebrew">` for the extras. Or add a comment in the code noting these are non-PTU extensions.

### INFO: UI Source Dropdown Label for Abilities
**File:** `app/components/gm/EncounterHeader.vue`, line 58
**Current:** `<option value="ability">Ability (5 rounds)</option>`
**Note:** This is actually correct per PTU 1.05 (abilities DO last 5 rounds). The label accurately represents the implementation. No change needed.

## Verdict

**APPROVED_WITH_NOTES**

The weather duration counter implementation is mechanically correct per PTU 1.05 rules:
- 5-round duration for both moves and abilities (correct)
- Auto-expiration when counter reaches 0 (correct)
- Weather overwriting replaces existing weather (correct)
- One weather effect at a time (correct, enforced by single weather field)
- Manual/indefinite weather for GM flexibility (good design)
- Round-end decrement timing is a reasonable interpretation (PTU does not specify)

The one MEDIUM issue is a misleading code comment that does not affect runtime behavior. The LOW issue about extra weather types is a UI clarity concern, not a rules violation. No blocking issues found.
