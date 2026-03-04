---
review_id: rules-review-297
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-005
domain: combat
commits_reviewed:
  - 3319923a
  - eb9d7385
  - d14f4492
  - f6acb5b5
  - a51fe8ac
  - 2d5e1260
  - 06313ff4
mechanics_verified:
  - shared-movement-pool-reset
  - shared-movement-pool-persistence
  - shared-movement-pool-modifiers
  - no-guard-client-server-parity
  - no-guard-decree-046-compliance
  - soulstealer-scene-frequency
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/10-indices-and-reference.md#Living Weapon (pp.305-306)
  - core/10-indices-and-reference.md#Ability: No Guard (p.325)
  - core/10-indices-and-reference.md#Ability: Soulstealer (p.329)
  - playtest-packet-2016.md#Ability: No Guard (line 525)
reviewed_at: 2026-03-04T13:30:00Z
follows_up: rules-review-294
---

## Mechanics Verified

### Shared Movement Pool Reset (rules-review-294 HIGH-001)

- **Rule:** PTU p.306 -- "the total amount Shifted during the round cannot exceed the Wielder's Movement Speed." Per-round cap implies reset each round.
- **Previous issue:** `resetWieldMovementPools()` was never called from round advancement code.
- **Fix:** `resetCombatantsForNewRound` in `turn-helpers.ts` lines 117-121 now resets `wieldMovementUsed` to 0 on wielder combatants at round start.
- **Status:** CORRECT. The reset fires for any combatant with `wieldMovementUsed !== undefined`, which is set on engagement and cleared on disengagement. This matches the mount reset pattern (lines 126-139 in the same function).

### Shared Movement Pool Persistence (code-review-321 H1)

- **Rule:** PTU p.306 -- shared pool must track cumulative movement across both combatants' turns within a single round.
- **Previous issue:** `reconstructWieldRelationships()` always set `movementUsedThisRound: 0`, losing mid-round tracking across API calls.
- **Fix:** `wieldMovementUsed` field persisted on the wielder combatant, read by reconstruction (`living-weapon-state.ts` line 47: `c.wieldMovementUsed ?? 0`), updated in `position.post.ts` lines 146-152 after each movement.
- **Status:** CORRECT. The value survives the JSON serialize/deserialize cycle through the encounter's combatants column. Mid-round API calls (position updates, damage calculations) will reconstruct the correct remaining pool.

### Shared Movement Pool Modifiers (rules-review-294 MEDIUM-002)

- **Rule:** PTU p.306 uses "the Wielder's Movement Speed." Movement Speed is subject to conditions (Slowed halves, Stuck zeroes, Speed CS modifies, Sprint adds 50%).
- **Previous issue:** Raw `getOverlandSpeed(wielder)` was used without applying modifiers.
- **Fix:** All three computation paths now apply `applyMovementModifiers(wielder, baseSpeed, weather)`:
  - Client `getMaxPossibleSpeed()` (useGridMovement.ts:160-163)
  - Client `getSpeed()` (useGridMovement.ts:237-241)
  - Server `getWieldedMovementSpeed()` (living-weapon-movement.service.ts:140-143)
- **Status:** CORRECT. A Slowed wielder will have a halved shared pool. A Stuck wielder will have 0 movement. Sprint correctly adds 50%. Weather parameter is passed for Thermosensitive interaction.

### No Guard Client-Server Parity (code-review-321 H3 + rules-review-294 MEDIUM-001)

- **Rule:** Per decree-046: "+3 bonus to all Attack Rolls for the user, AND +3 bonus to all Attack Rolls against the user." Per PTU p.306: suppressed while wielded.
- **Previous issue:** Server applied No Guard correctly; client did not check for it at all.
- **Fix:** Client-side `useMoveCalculation.ts` now has `hasActiveNoGuard()` (lines 431-442) and `getNoGuardBonus()` (lines 454-469). `getAccuracyThreshold()` (line 485) subtracts the combined bonus. Server-side `calculate-damage.post.ts` (lines 358-367) now checks both attacker and target No Guard.
- **Status:** CORRECT. Verified both paths produce identical accuracy thresholds for the same inputs. The formula is: `Math.max(1, moveAC + effectiveEvasion - accuracyStage - flankingPenalty + roughPenalty - noGuardBonus)`. Both attacker and target No Guard are checked with suppression awareness.

### No Guard Decree Compliance (rules-review-294 MEDIUM-003)

- **Rule:** Ambiguous -- core rulebook (p.325) vs playtest packet (2016, line 525).
- **Previous issue:** No decree existed to formalize which version the system follows.
- **Fix:** decree-046 recorded. Ruling: "Use the 2016 playtest packet version of No Guard -- +3 bonus to all Attack Rolls for the user, +3 bonus to all Attack Rolls against the user, affecting all attack types."
- **Status:** CORRECT. decree-046 is referenced in implementation comments at all three code sites (abilities service, client composable, server endpoint). Implementation matches the decree ruling exactly.

### Soulstealer Scene Frequency (code-review-321 M3 + rules-review-294 HIGH-002)

- **Rule:** "Scene -- Free Action" (`core/10-indices-and-reference.md`, line 2418). Soulstealer can trigger at most once per scene.
- **Previous issue:** No frequency enforcement. Healing applied on every qualifying faint.
- **Fix:** `checkSoulstealer()` (living-weapon-abilities.service.ts:168-172) checks `featureUsage['Soulstealer']` before triggering. `applySoulstealerHealing()` (lines 200-209) records usage with `maxPerScene: 1`.
- **Status:** CORRECT. The `featureUsage` pattern matches the established infrastructure (Lean In, Overrun from feature-004 P2). After the first trigger, `usedThisScene` becomes 1, which equals `maxPerScene` (1), and subsequent calls to `checkSoulstealer()` return `null`.

### Decree Compliance

- **decree-001:** Minimum 1 damage. Not affected by these fixes.
- **decree-043:** Combat Skill Rank gates move access, not engagement. Not affected by these fixes.
- **decree-044:** No phantom Bound condition. Not affected by these fixes.
- **decree-045:** Sun Blanket healing. Not affected by these fixes.
- **decree-046:** No Guard uses playtest +3/-3 flat accuracy. Implementation confirmed compliant (see above).

## Rulings

No new rulings needed. All mechanics verified against existing decrees and PTU core text.

## Verdict

**APPROVED**

All 5 issues from rules-review-294 have been resolved correctly. The shared movement pool now resets at round start, persists mid-round, and applies movement modifiers. No Guard is implemented per decree-046 on both client and server. Soulstealer is limited to Scene x1 via the established featureUsage pattern. No new game logic issues found.

## Required Changes

None.
