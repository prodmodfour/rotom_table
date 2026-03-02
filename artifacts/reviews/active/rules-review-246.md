---
review_id: rules-review-246
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-view+capture+healing
commits_reviewed:
  - e4e9a639
  - 0379fb83
  - 9a6b9bee
  - c9ec6aec
  - 5271574d
  - c9dd7374
mechanics_verified:
  - capture-action-economy
  - breather-action-economy
  - healing-item-action-economy
  - capture-accuracy-check
  - capture-rate-system
  - breather-full-action
  - gm-approval-workflow
  - ball-type-propagation
  - healing-item-id-types
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 2
ptu_refs:
  - core/05-pokemon.md#Page 214 (Capturing Pokemon)
  - core/07-combat.md#Page 227 (Action Types)
  - core/07-combat.md#Page 245 (Take a Breather)
  - core/09-gear-and-items.md#Page 276 (Using Items)
reviewed_at: 2026-03-02T21:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Capture Action Economy (Standard Action)

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll, with a range equal to 4 plus your Athletics Rank." (`core/05-pokemon.md#Page 214`)
- **Implementation:** `requestCapture` in `usePlayerCombat.ts` correctly documents capture as a Standard Action (PTU p.227) in the JSDoc comment. The `attemptCapture` function in `useCapture.ts` attempts to consume the Standard Action via `$fetch(/api/encounters/${encounterId}/action)` when `encounterContext` is provided. The action consumption endpoint is a pre-existing concern (see PRE-EXISTING-002).
- **Status:** CORRECT (documentation and intent)

### 2. Breather Action Economy (Full Action)

- **Rule:** "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action to move as far away from enemies as possible, using their highest available Movement Capability." (`core/07-combat.md#Page 245`)
- **Implementation:** `requestBreather` correctly documents this as a Full Action (PTU p.245). The server endpoint `breather.post.ts` (lines 172-178) correctly sets `standardActionUsed: true, shiftActionUsed: true`, consuming both actions. The `handleApproveBreather` handler correctly delegates to this endpoint.
- **Status:** CORRECT

### 3. Healing Item Action Economy (Standard Action)

- **Rule:** "Applying Restorative Items, or X Items is a Standard Action, which causes the target to forfeit their next Standard Action and Shift Action, unless the user has the 'Medic Training' Edge." (`core/09-gear-and-items.md#Page 276`)
- **Implementation:** `requestHealingItem` correctly documents using items as a Standard Action (PTU p.276). The `use-item.post.ts` endpoint comment (line 12) notes action economy is deferred to P2. No game logic bug here -- the deferral is intentional and documented.
- **Status:** CORRECT (action enforcement intentionally deferred to P2)

### 4. Capture Accuracy Check (AC 6)

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (`core/05-pokemon.md#Page 214`). "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll."
- **Implementation:** `rollAccuracyCheck()` in `useCapture.ts` rolls 1d20 and checks for nat 20, but does NOT compare the result against AC 6 to determine hit/miss. The `handleApproveCapture` handler calls `rollAccuracyCheck()` then always proceeds to `attemptCapture()` regardless of the roll result. The ball never misses.
- **Status:** INCORRECT -- However, this is a **pre-existing issue** in `useCapture.ts` (not modified in any of the 6 P0 commits). See PRE-EXISTING-001.

### 5. Capture Rate System (1d100)

- **Rule:** Per decree-013, use the core 1d100 capture system exclusively. "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features." (`core/05-pokemon.md#Page 214`)
- **Implementation:** The capture flow in `handleApproveCapture` calls `attemptCapture` which calls `/api/capture/attempt` which uses `attemptCapture()` from `captureRate.ts` -- the 1d100 system. Per decree-013, this is correct.
- **Status:** CORRECT

### 6. Ball Type Default String Mismatch

- **Rule:** Different Poke Ball types have different capture modifiers (PTU p.271-273). The system catalogs them in `POKE_BALL_CATALOG` with key `'Basic Ball'` as the default (`DEFAULT_BALL_TYPE = 'Basic Ball'` in `constants/pokeBalls.ts:351`).
- **Implementation:** `requestCapture` in `usePlayerCombat.ts` (line 363) defaults `ballType` to the string `'Poke Ball'`. `PlayerRequestPanel.vue` (line 279) also defaults to `'Poke Ball'`. However, the catalog key for the basic ball is `'Basic Ball'`, not `'Poke Ball'`. When the string `'Poke Ball'` reaches the server's `attempt.post.ts`, the validation at lines 104-108 (`if (body.ballType && !ballDef)`) throws a 400 error.
- **Status:** INCORRECT -- See CRITICAL-001.

### 7. Ball Type Not Passed to attemptCapture

- **Rule:** The capture attempt must use the ball type the player selected, as different balls have different capture modifiers.
- **Implementation:** `handleApproveCapture` in `usePlayerRequestHandlers.ts` receives `data.ballType` in its function parameters (line 40) but does NOT pass it to `attemptCapture()` (lines 55-63). The `ballType` property is omitted from the call, so every capture through the player request flow defaults to `DEFAULT_BALL_TYPE` ('Basic Ball') regardless of the player's actual ball selection.
- **Status:** INCORRECT -- See HIGH-001.

### 8. Breather Effects

- **Rule:** "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions." (`core/07-combat.md#Page 245`). Per decree-014, Stuck/Slow are separate from volatile conditions.
- **Implementation:** The breather endpoint correctly implements all effects: stage reset to defaults (including Heavy Armor speed CS adjustment), temp HP removal, volatile condition + Slow/Stuck cure (excluding Cursed per p.245 special rule), re-application of persistent status CS effects (decree-005), Tripped + Vulnerable (standard) or Tripped + ZeroEvasion (assisted), initiative reorder on speed change (decree-006), move log entry.
- **Status:** CORRECT

### 9. GM Approval Workflow

- **Rule:** The GM approval workflow is an app-level implementation choice. The key requirement is that GM approval does not bypass any PTU validation.
- **Implementation:** The workflow correctly delegates to existing validated endpoints: `attemptCapture` (capture rate, owned check, 0 HP check), `breather.post.ts` (stage reset, condition cure, action consumption), and `encounterStore.useItem` (item validation, HP restoration). The GM approving a request triggers the same code path as GM-initiated actions.
- **Status:** CORRECT -- No PTU validation is bypassed.

### 10. Healing Item Entity ID vs Combatant ID

- **Rule:** The `use-item.post.ts` endpoint (lines 6-7) expects combatant IDs for `userId` and `targetId`, passing them to `findCombatant` which searches by `c.id` (combatant wrapper ID).
- **Implementation:** `handleApproveHealingItem` (lines 187-190) passes `trainerCombatant.entityId` as the `userId` argument. This is an entity ID (e.g., the HumanCharacter record ID), not the combatant ID. The existing GM `UseItemModal.vue` correctly passes combatant IDs (confirmed at line 113-114: "Combatant ID of the user applying the item").
- **Status:** INCORRECT -- See MEDIUM-001.

---

## Summary

P0 implements the player action request framework (types, request functions, GM panel, event handlers) with correct PTU rule references in documentation. The action economy classifications are accurate: capture = Standard Action, breather = Full Action, healing item = Standard Action. The breather endpoint is thorough and rules-accurate. The GM approval workflow correctly delegates to existing validated endpoints without bypassing PTU rules. All relevant decrees are respected.

However, two issues in the capture flow will cause runtime failures (ball type string mismatch and ball type not passed through), and one issue in the healing item flow will cause a 404 error (entity ID vs combatant ID mismatch).

---

## Issues

### CRITICAL-001: Ball type default uses 'Poke Ball' instead of 'Basic Ball'

**Severity:** CRITICAL
**Files:** `app/composables/usePlayerCombat.ts:363`, `app/components/encounter/PlayerRequestPanel.vue:279`
**Rule:** Ball types must match `POKE_BALL_CATALOG` keys. The default key is `DEFAULT_BALL_TYPE = 'Basic Ball'` (from `constants/pokeBalls.ts:351`). The description says "often called just a 'Poke Ball'" but the catalog key is `'Basic Ball'`.
**Problem:** Both `requestCapture` and the PlayerRequestPanel's approve handler default `ballType` to the string literal `'Poke Ball'`, which does not exist as a key in `POKE_BALL_CATALOG`. When this string reaches the server's `attempt.post.ts`, the validation at line 104 (`if (body.ballType && !ballDef)`) will throw a 400 error, completely blocking all player capture requests that don't explicitly specify a valid ball type key.
**Fix:** Replace `'Poke Ball'` with `DEFAULT_BALL_TYPE` imported from `~/constants/pokeBalls` in both locations. Or use the string literal `'Basic Ball'`.

### HIGH-001: handleApproveCapture does not pass ballType to attemptCapture

**Severity:** HIGH
**File:** `app/composables/usePlayerRequestHandlers.ts:55-63`
**Rule:** Capture attempts must use the correct ball type for modifier calculation (PTU p.271-273). Great Ball gives -10 to capture roll, Ultra Ball gives -15, etc.
**Problem:** The `handleApproveCapture` function receives `data.ballType` in its parameters (line 40) but omits it from the `attemptCapture()` call (lines 55-63). The ball type the player selected is silently dropped, and every capture defaults to `DEFAULT_BALL_TYPE` ('Basic Ball', modifier 0). Great Ball (-10), Ultra Ball (-15), and all specialty balls are effectively ignored.
**Fix:** Add `ballType: data.ballType` to the `attemptCapture` params object:
```typescript
const result = await attemptCapture({
  pokemonId: data.targetPokemonId,
  trainerId: trainerCombatant.entityId,
  accuracyRoll: accuracyResult.roll,
  ballType: data.ballType,  // ADD THIS
  encounterContext: {
    encounterId: encounter.value.id,
    trainerCombatantId: data.trainerCombatantId
  }
})
```

### MEDIUM-001: handleApproveHealingItem passes entity ID instead of combatant ID

**Severity:** MEDIUM
**File:** `app/composables/usePlayerRequestHandlers.ts:187-190`
**Rule:** The `use-item.post.ts` endpoint expects combatant IDs for `userId` (line 6: "combatant ID of the item user") and `targetId` (line 7: "combatant ID of the item target"). It passes them to `findCombatant` which searches by `c.id` (the combatant wrapper ID in the encounter array).
**Problem:** `trainerCombatant.entityId` is passed as the `userId` argument. This is the Prisma entity ID (e.g., the HumanCharacter record UUID), not the combatant wrapper ID. At runtime, `findCombatant(combatants, body.userId)` will fail to match any combatant and throw a 404 "Combatant not found" error. The existing GM UseItemModal correctly passes combatant IDs (confirmed at UseItemModal.vue line 113-114).
**Fix:** Pass `data.trainerCombatantId` (the combatant ID from the request) instead of `trainerCombatant.entityId`:
```typescript
const itemResult = await encounterStore.useItem(
  data.healingItemName,
  data.trainerCombatantId,  // combatant ID, not entity ID
  data.healingTargetId
)
```
**Note:** This also requires that `healingTargetId` from the player request is a combatant ID. The P0 type definition is ambiguous on this point -- consider adding a JSDoc comment clarifying the expected ID type for P1/P2 implementation.

### MEDIUM-002: Capture ack sent with undefined fields when attemptCapture returns null

**Severity:** MEDIUM
**File:** `app/composables/usePlayerRequestHandlers.ts:78-92`
**Rule:** If the capture attempt fails to execute (network error, 400 from invalid ball type, etc.), the player should receive a clear failure indication, not ambiguous partial data.
**Problem:** `attemptCapture` returns `null` on failure (it catches errors internally and returns null rather than throwing). When `result` is `null`, the ack at lines 79-92 sends `captured: false` with `undefined` values for `captureRate`, `roll`, and `reason`. The player receives an ack that looks like the ball hit and capture failed, when in reality the attempt never executed. The `catch` block at line 93 handles thrown errors, but `attemptCapture` does not throw -- it returns null.
**Fix:** Add a null check before sending the ack:
```typescript
if (!result) {
  send({
    type: 'player_action_ack',
    data: {
      requestId: data.requestId,
      status: 'rejected',
      reason: 'Capture attempt failed to execute'
    }
  })
  return
}
```

---

## Pre-Existing Issues (Not Introduced in P0)

These issues exist in files not modified by the P0 commits. Documenting them per L2 (always file tickets for pre-existing issues).

### PRE-EXISTING-001: Accuracy check does not gate capture attempt (AC 6 not enforced)

**File:** `app/composables/useCapture.ts:227-234` (not modified in P0)
**Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (PTU p.214). If the d20 roll is below 6, the ball misses the target and no capture roll should occur.
**Current behavior:** `rollAccuracyCheck()` returns the raw d20 roll but the caller always proceeds to `attemptCapture()` regardless of whether the roll meets AC 6. Every Poke Ball throw automatically hits.
**Impact:** Overpowered capture mechanics -- balls never miss. Per PTU, approximately 25% of basic throws (rolling 1-5 on d20) should miss.
**Recommendation:** File a ticket for P1 (Capture UI) to add AC 6 check gating.

### PRE-EXISTING-002: Standard Action consumption endpoint missing

**File:** `app/composables/useCapture.ts:192` references `/api/encounters/${encounterId}/action` which does not exist in the API routes.
**Impact:** The `warning` ref gets set ("Capture succeeded but standard action was not consumed") but the Standard Action is never consumed for capture attempts in encounters. The code is in a try/catch so it does not crash.
**Recommendation:** File a ticket if not already tracked. Must be resolved before player capture goes live.

---

## Decree Compliance

| Decree | Status | Notes |
|--------|--------|-------|
| decree-013 (1d100 capture system) | COMPLIANT | Player capture path delegates to the existing 1d100 `attemptCapture` server endpoint |
| decree-014 (Stuck/Slow separate) | COMPLIANT | Not directly exercised by P0; underlying `captureRate.ts` and `breather.post.ts` handle correctly |
| decree-015 (Real max HP for capture) | COMPLIANT | Not directly exercised by P0; underlying `/api/capture/attempt` reads `pokemon.maxHp` from DB (real max) |
| decree-017 (PC heals to effective max) | N/A | Healing item flow uses existing `use-item.post.ts` which has separate HP cap logic |
| decree-029 (Rest healing min 1 HP) | N/A | Breather does not heal HP; rest healing composable not modified in P0 |

No decree violations found.

---

## Rulings

1. **Action economy classifications are correct.** Capture = Standard Action (PTU p.214/227), breather = Full Action (PTU p.245), healing item = Standard Action (PTU p.276). All type definition comments cite correct page references.

2. **GM approval workflow is an acceptable abstraction.** PTU does not specify a "request/approve" pattern, but this is the correct approach for a digital table where the GM needs to maintain control. The implementation correctly delegates to the same validated server endpoints used by GM-initiated actions. No PTU validation is bypassed.

3. **Assisted breather differentiation is correct.** Standard breather applies Tripped + Vulnerable; assisted applies Tripped + ZeroEvasion. Both are Full Actions (p.245). The assisted variant's Command Check DC 12 is left to GM adjudication, which is acceptable. The assistant's Standard Action consumption is noted in the endpoint comment as requiring manual GM handling.

4. **Healing item target forfeit mechanic correctly deferred.** PTU p.276 states the target forfeits their next Standard + Shift Action (unless Medic Training). This is noted in the use-item endpoint comments as P2 scope. Acceptable for P0.

5. **Healing item self-use is Full Round action.** PTU p.276 states "If you use a Restorative Item on yourself it is a Full-Round action." The current P0 flow does not distinguish self-use from other-use. This is acceptable since action economy is deferred to P2.

---

## Verdict

**CHANGES_REQUIRED**

Two issues block correct game behavior in the capture flow:
- **CRITICAL-001** prevents all player capture requests from succeeding due to incorrect ball type string (`'Poke Ball'` vs `'Basic Ball'`)
- **HIGH-001** silently ignores the player's ball type selection during capture execution (ball type not passed through)

Two additional issues affect the healing item flow and capture error handling:
- **MEDIUM-001** will cause 404 errors in the healing item flow due to entity ID vs combatant ID mismatch
- **MEDIUM-002** sends misleading capture results to the player when the capture attempt fails to execute

---

## Required Changes

1. **[CRITICAL]** Replace `'Poke Ball'` with `'Basic Ball'` (or import `DEFAULT_BALL_TYPE`) in `app/composables/usePlayerCombat.ts:363` and `app/components/encounter/PlayerRequestPanel.vue:279`
2. **[HIGH]** Add `ballType: data.ballType` to the `attemptCapture` call in `app/composables/usePlayerRequestHandlers.ts:55-63`
3. **[MEDIUM]** Change `trainerCombatant.entityId` to `data.trainerCombatantId` in `app/composables/usePlayerRequestHandlers.ts:189`
4. **[MEDIUM]** Add null check for `attemptCapture` result before sending ack in `app/composables/usePlayerRequestHandlers.ts:78`
5. **[Recommended]** File tickets for PRE-EXISTING-001 (AC 6 not enforced) and PRE-EXISTING-002 (missing action endpoint) if not already tracked
