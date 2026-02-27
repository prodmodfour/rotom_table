---
review_id: rules-review-045
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-032, ptu-rule-034, ptu-rule-038, refactoring-031
domain: healing, encounter-ui
commits_reviewed:
  - 65d8fa8
  - 3b5ede0
  - 290f948
mechanics_verified:
  - maxHp-response-field
  - healing-field-passthrough
  - pokemon-drainedAp-omission
  - natural-healing-timer-preservation
  - ap-drain-timer-preservation
  - pokemon-center-ap-removal
  - combatant-type-narrowing
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Resting (lines 1995-2028)
  - core/07-combat.md#Pokemon Centers (lines 2015-2028)
  - core/07-combat.md#Extended Rests (lines 2009-2014)
reviewed_at: 2026-02-19T16:00:00
---

## Review Scope

Three commits implementing healing API fixes and encounter card type refactoring:
- `65d8fa8` — fix: correct maxHp response and add healing fields to character PUT
- `3b5ede0` — feat: add healing fields to Pokemon PUT endpoint
- `290f948` — refactor: replace as any casts with typed computeds in encounter cards

Also verified the current state of related ticket fixes: ptu-rule-032 (AP drain timer), ptu-rule-034 (natural healing timer), ptu-rule-038 (Pokemon Center AP removal).

## Mechanics Verified

### 1. maxHp Response Field (65d8fa8)
- **Rule:** Trainer HP = `(level * 2) + (baseHp * 3) + 10`. The `hp` column stores the base stat; `maxHp` stores the calculated value.
- **Implementation:** Response changed from `maxHp: character.hp` (base stat) to `maxHp: character.maxHp` (calculated max HP).
- **Status:** CORRECT
- The previous code was returning the raw base HP stat as `maxHp`, which would have been significantly lower than the actual calculated max HP.

### 2. Healing Field Passthrough — Character PUT (65d8fa8)
- **Rule:** N/A — these are pass-through fields with no PTU computation. Fields added: `maxHp`, `injuries`, `drainedAp`, `restMinutesToday`, `injuriesHealedToday`, `lastInjuryTime`, `lastRestReset`.
- **Implementation:** Standard `if (body.X !== undefined) updateData.X = body.X` pattern. Date fields use `body.lastInjuryTime ? new Date(body.lastInjuryTime) : null` for correct null handling.
- **Status:** CORRECT
- No PTU formulas are computed. The PUT endpoint is a generic editor — validation responsibility lies in the dedicated healing endpoints.

### 3. Healing Field Passthrough — Pokemon PUT (3b5ede0)
- **Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP." (`core/07-combat.md`, line 2006-2007). AP drain is a Trainer-only mechanic.
- **Implementation:** Pokemon PUT adds `injuries`, `restMinutesToday`, `injuriesHealedToday`, `lastInjuryTime`, `lastRestReset`. Correctly omits `drainedAp` — Pokemon have no AP in PTU.
- **Status:** CORRECT
- Field set matches the Pokemon model (no AP), while character PUT correctly includes `drainedAp` for Trainers.

### 4. Combatant Type Narrowing (290f948)
- **Rule:** N/A — pure TypeScript refactoring, no game logic.
- **Implementation:** Replaced 6 `as any` template casts across 3 encounter card components with typed computed properties. `avatarUrl` narrows to `HumanCharacter` when `!isPokemon`, `pokemonTypes` narrows to `Pokemon` when `isPokemon`. The `Combatant.entity` union is `Pokemon | HumanCharacter` per `types/encounter.ts:55`.
- **Status:** CORRECT
- Template rendering behavior is unchanged. Type narrowing logic is sound — only `HumanCharacter` has `avatarUrl`, only `Pokemon` has `types`.

### 5. Related Ticket Fix Verification — ptu-rule-032 (AP Drain Timer)
- **Rule:** "If a Pokemon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries." (`core/07-combat.md`, lines 2004-2005). The timer tracks injury **gain**, not injury **healing**. AP drain heals (removes) an injury — it should not reset the natural healing timer.
- **Implementation:** `characters/[id]/heal-injury.post.ts:76` — AP drain path uses `...(newInjuries === 0 ? { lastInjuryTime: null } : {})`. Timer is only cleared when injuries reach 0, never reset to `new Date()`.
- **Status:** CORRECT

### 6. Related Ticket Fix Verification — ptu-rule-034 (Natural Healing Timer)
- **Rule:** Same as above — the 24h timer tracks when injuries are gained, not healed. Healing an injury should not reset the timer.
- **Implementation:** Both `characters/[id]/heal-injury.post.ts:119` and `pokemon/[id]/heal-injury.post.ts:83` use the same conditional spread pattern. Timer is only cleared when all injuries are gone.
- **Status:** CORRECT

### 7. Related Ticket Fix Verification — ptu-rule-038 (Pokemon Center AP)
- **Rule:** Pokemon Centers provide: full HP, all status conditions cleared, daily-frequency moves restored, up to 3 injuries/day (`core/07-combat.md`, lines 2015-2028). Drained AP restoration is exclusively an Extended Rest benefit (lines 2009-2011). Pokemon Centers are not rests.
- **Implementation:** `characters/[id]/pokemon-center.post.ts` — no `drainedAp` field in the update payload. `apRestored: 0` hardcoded in response. JSDoc explicitly notes "Pokemon Centers do NOT restore drained AP."
- **Status:** CORRECT

## Pre-Existing Issue

### Pokemon Center incorrectly maxes out daily rest budget (ptu-rule-040)

Both Pokemon Center endpoints set `restMinutesToday: 480` (8 hours), consuming the character/Pokemon's entire daily rest-healing budget:
- `characters/[id]/pokemon-center.post.ts:71`: `restMinutesToday: 480`
- `pokemon/[id]/pokemon-center.post.ts:85`: `restMinutesToday: 480`

**Rule:** "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points." (`core/07-combat.md`, lines 1995-1998). The 8-hour limit is on actual **rest** time. A Pokemon Center visit is a medical procedure using "expensive and advanced machinery" — it is not rest.

**Impact:** After a Pokemon Center visit, the character/Pokemon cannot rest-heal for the remainder of the day. If they take damage after the visit, their only recovery option is another Pokemon Center visit. PTU does not restrict rest after a Pokemon Center visit.

**Severity:** MEDIUM — only affects the scenario where damage is taken after a same-day Pokemon Center visit.

**Ticket filed:** ptu-rule-040

## Summary
- Mechanics checked: 7
- Correct: 7
- Incorrect: 0
- Needs review: 0
- Pre-existing issues found: 1 (ptu-rule-040, MEDIUM)

## Rulings
None required — no ambiguous mechanics encountered.

## Verdict
APPROVED — All three commits are PTU-correct. The maxHp response fix resolves a real bug. Healing field passthroughs are clean with no PTU computation. Type narrowing refactoring has no game logic impact. All three related ticket fixes (ptu-rule-032, 034, 038) are verified correct in current code. One pre-existing MEDIUM issue discovered and ticketed (ptu-rule-040).

## Required Changes
None — all reviewed commits are correct.
