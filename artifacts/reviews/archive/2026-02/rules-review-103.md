---
review_id: rules-review-103
target: ptu-rule-076
trigger: dev-fix
verdict: PASS
reviewed_commits: [c2a28bc, 49cc263]
reviewed_files: [app/server/api/encounters/[id]/breather.post.ts, app/composables/useEncounterActions.ts, app/constants/statusConditions.ts]
date: 2026-02-20
reviewer: game-logic-reviewer
---

## PTU Rules Verification Report

### Scope
- [x] Verify `shiftActionUsed = true` fix correctly reflects Take a Breather as a Full Action (PTU p.245)
- [x] Verify all Take a Breather effects are correctly implemented in the server endpoint
- [x] Verify volatile conditions list matches PTU 1.05 volatile afflictions
- [x] Verify Cursed exclusion logic matches PTU p.245 requirements
- [x] Verify client-side and server-side action tracking are consistent

### Mechanics Verified

#### 1. Full Action Tracking (shiftActionUsed Fix)
- **Rule:** "Full Actions take both your Standard Action and Shift Action for a turn. The Take a Breather (page 245), Coup de Grace (251), and Intercept (242) Actions are all Full Actions." (PTU p.227)
- **Implementation:** Commit `c2a28bc` adds `combatant.turnState.shiftActionUsed = true` at line 99, alongside the existing `standardActionUsed = true` (line 98) and `hasActed = true` (line 100). The comment was updated to read "Mark as having used their full action (standard + shift) -- PTU p.245".
- **Status:** CORRECT
- **Severity:** N/A (fix verified)

#### 2. Combat Stage Reset
- **Rule:** "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level" (PTU p.245)
- **Implementation:** Lines 57-62 check if any stage modifiers are non-zero, then reset via `createDefaultStageModifiers()` which returns all-zero stages.
- **Status:** CORRECT
- **Severity:** N/A

#### 3. Temporary HP Removal
- **Rule:** "lose all Temporary Hit Points" (PTU p.245)
- **Implementation:** Lines 65-68 check for `entity.temporaryHp > 0` and set it to 0.
- **Status:** CORRECT
- **Severity:** N/A

#### 4. Volatile Status Condition Curing
- **Rule:** "cured of all Volatile Status effects and the Slow and Stuck conditions" (PTU p.245)
- **Implementation:** The `BREATHER_CURED_CONDITIONS` array (line 19-23) includes all volatile conditions from `VOLATILE_CONDITIONS` (excluding Cursed) plus 'Slowed' and 'Stuck'. Lines 70-82 iterate current statuses and remove any that match.
- **PTU Volatile Afflictions (p.247):** Bad Sleep, Confused, Cursed, Disabled, Rage, Flinch, Infatuation, Sleep, Suppressed (9 total)
- **Code VOLATILE_CONDITIONS:** Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed (9 total)
- **Name mappings are semantically correct:** Sleep->Asleep, Flinch->Flinched, Infatuation->Infatuated, Rage->Enraged. These aliases are used consistently throughout the codebase.
- **Additional conditions:** Slowed and Stuck are correctly included per the rule text.
- **Status:** CORRECT
- **Severity:** N/A

#### 5. Cursed Exclusion
- **Rule:** "To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters at the end of the Shift triggered by Take a Breather." (PTU p.245)
- **Implementation:** Cursed is explicitly filtered out of `BREATHER_CURED_CONDITIONS` via `.filter(c => c !== 'Cursed')` (line 20). Comment explains: "Since the app does not track curse sources, Cursed is excluded from auto-clearing and left for the GM to remove manually when the prerequisite is met."
- **Status:** CORRECT -- The app does not track positional relationships between curse sources and targets, so deferring to GM adjudication is the correct design choice. Auto-clearing Cursed would violate the conditional requirement.
- **Severity:** N/A

#### 6. Tripped + Vulnerable Application
- **Rule:** "They then become Tripped and are Vulnerable until the end of their next turn." (PTU p.245)
- **Implementation:** Lines 84-95 add 'Tripped' and 'Vulnerable' to `combatant.tempConditions` (temporary conditions that persist until cleared). Conditions are added immutably using spread operator. Duplicate check prevents double-application.
- **Status:** CORRECT
- **Severity:** N/A

#### 7. No HP Recovery (Absence Verification)
- **Rule:** PTU p.245 does NOT specify any HP recovery for Take a Breather. The effects are: reset stages, lose temp HP, cure volatile statuses + Slow/Stuck, apply Tripped + Vulnerable, shift away from enemies.
- **Implementation:** The endpoint correctly does NOT include any HP recovery logic.
- **Status:** CORRECT
- **Severity:** N/A

#### 8. Client-Server Consistency
- **Rule:** Full Actions consume both Standard and Shift actions.
- **Implementation:** The client-side composable (`useEncounterActions.ts`, lines 143-145) calls `useAction(combatantId, 'standard')` and `useAction(combatantId, 'shift')` for take-a-breather, intercept-melee, and intercept-ranged. The server endpoint now also sets both `standardActionUsed` and `shiftActionUsed`. The server is now authoritative regardless of client behavior.
- **Status:** CORRECT
- **Severity:** N/A

#### 9. Shift Requirement (Move Log)
- **Rule:** "requires a Pokemon or Trainer to use their Shift Action to move as far away from enemies as possible, using their highest available Movement Capability" (PTU p.245)
- **Implementation:** The move log entry (line 119) includes: "SHIFT REQUIRED: Move away from all enemies using full movement." This correctly flags the GM to handle the movement component, since automatic movement away from all enemies requires spatial awareness the endpoint does not have.
- **Status:** CORRECT
- **Severity:** N/A

### Duplicate Code Path Verification

The resolution log in ptu-rule-076 claims the breather endpoint is the only server endpoint that sets action flags on `turnState`, and that the Intercept maneuver is handled entirely client-side. This is consistent with what I observed in `useEncounterActions.ts` (lines 143-145), where intercept-melee and intercept-ranged use `encounterStore.useAction()` calls without a dedicated server endpoint.

### Summary
- Mechanics checked: 9
- Correct: 9
- Incorrect: 0

The fix in commit `c2a28bc` correctly addresses the ticket. The breather endpoint now authoritatively tracks both standard and shift action usage, matching the PTU Full Action definition. All other Take a Breather effects (stage reset, temp HP removal, volatile condition curing, Cursed exclusion, Tripped/Vulnerable application, no HP recovery) are correctly implemented per PTU 1.05 p.245.
