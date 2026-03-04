---
review_id: rules-review-294
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-005
domain: combat
commits_reviewed:
  - ac823e03
  - cff00ced
  - 55e0da12
  - 14fff144
  - 09b5587c
  - b183b1ad
  - e7fbb5d0
  - 68199a85
  - dbff2600
  - ee9c3b05
  - f56a7fdf
  - 364b7dc7
  - 8163e4b0
  - 9a31b80f
mechanics_verified:
  - shared-movement-pool
  - linked-position-sync
  - no-guard-suppression
  - aegislash-forced-blade-forme
  - weaponize-intercept
  - soulstealer-healing
  - weapon-move-db-values
  - movement-pool-reset
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 3
ptu_refs:
  - core/10-indices-and-reference.md#Living Weapon (pp.305-306)
  - core/09-gear-and-items.md#Weapon Moves (pp.288-290)
  - core/10-indices-and-reference.md#Ability: No Guard (p.325)
  - core/10-indices-and-reference.md#Ability: Stance Change (p.330)
  - core/10-indices-and-reference.md#Ability: Weaponize (p.332)
  - core/10-indices-and-reference.md#Ability: Soulstealer (p.329)
  - core/09-gear-and-items.md#Small Melee Weapons (p.287)
  - playtest-packet-2016.md#Ability: No Guard (line 525)
reviewed_at: 2026-03-04T12:15:00Z
follows_up: rules-review-292
---

## Mechanics Verified

### J. Shared Movement Pool (PTU p.306)

- **Rule:** "If the Living Weapon is also being used as an active Pokemon, the Wielder and the Living Weapon use the Wielder's Movement Speed to shift during each of their turns, and the total amount Shifted during the round cannot exceed the Wielder's Movement Speed." (`core/10-indices-and-reference.md`, line 243-247)
- **Implementation:** `getWieldedMovementSpeed()` in `living-weapon.service.ts:636-653` computes remaining pool as `wielderSpeed - movementUsedThisRound`. Client-side `useGridMovement.ts:148-163` and `getSpeed` at lines 223-238 both check `encounter.wieldRelationships` and return `wielderSpeed - movementUsedThisRound`. `handleLinkedMovement()` at `living-weapon.service.ts:583-624` updates both positions and increments the pool. Client-side `useEncounterActions.ts:307-324` mirrors this locally.
- **Status:** CORRECT (formula and pool mechanics)
- **Issue:** See HIGH-001 below -- `resetWieldMovementPools` is never called.

### J. Linked Position Sync (PTU p.306)

- **Rule:** Shared position -- wielder and weapon occupy the same cell while engaged.
- **Implementation:** `syncWeaponPosition()` in `living-weapon.service.ts:547-566` copies wielder position to weapon. `position.post.ts:116-148` handles bidirectional sync -- when either combatant moves, the partner follows. `engage.post.ts:148-152` syncs weapon position on engage.
- **Status:** CORRECT -- both directions handled in position endpoint, engage syncs weapon to wielder.

### K. No Guard Ability Suppression (PTU p.306)

- **Rule:** "While Wielded, a Living Weapon cannot benefit from its No Guard Ability." (`core/10-indices-and-reference.md`, line 262-263)
- **Implementation:** `isNoGuardActive()` in `living-weapon.service.ts:681-698` returns `false` when the Pokemon is wielded (found in `wieldRelationships` as `weaponId`). Used in `calculate-damage.post.ts:360-362` to conditionally apply `-3` AC reduction.
- **Status:** CORRECT for server-side damage calculation. See MEDIUM-001 for client-side gap.

**Note on No Guard definition:** The core rulebook (p.325) defines No Guard as "The user may not apply any form of Evasion to avoiding Melee attacks; however, the user ignores all forms of evasion when making Melee attack rolls." The playtest packet (2016, line 525) redefines it as "+3 bonus to all Attack Rolls; however all foes gain a +3 Bonus on Attack Rolls against the user." The implementation uses the playtest version (-3 to AC). This is a pre-existing design choice, not a P2 issue, but no decree exists to formalize which version the system follows. See MEDIUM-003 for decree-need recommendation.

### L. Aegislash Forced Blade Forme (PTU p.306)

- **Rule:** "an Aegislash is automatically in Blade forme [while wielded]." (`core/10-indices-and-reference.md`, line 263-264). Stance Change (p.330): "swaps its Attack Stat with its Defense and its Special Attack Stat with its Special Defense, without changing Combat Stages."
- **Implementation:** `swapAegislashStance()` in `living-weapon.service.ts:710-722` swaps `attack<->defense` and `specialAttack<->specialDefense` in `currentStats`. Engage endpoint (`engage.post.ts:103-138`) checks `isAegislashBladeForm()` (heuristic: attack > defense), tracks `wasInBladeFormeOnEngage`, and applies swap if not already in Blade. Disengage endpoint (`disengage.post.ts:90-123`) reverts based on the tracking flag.
- **Status:** CORRECT
  - Stat swap matches PTU RAW (Attack<->Defense, SpAtk<->SpDef).
  - Pre-engage state tracking via `wasInBladeFormeOnEngage` correctly preserves revert information.
  - Disengage only reverts if the Aegislash was NOT in Blade forme before engage (line 102: `!wasAlreadyBlade && isCurrentlyBlade`).
  - Heuristic detection (attack > defense) is noted as a limitation in the design spec and is acceptable for P2. Edge case: an Aegislash with equal Attack and Defense after stat modifications would be misidentified, but this is extremely unlikely with base stats of 5 vs 15.

### M. Weaponize Ability -- Free Action Intercept (PTU p.332)

- **Rule:** "While being wielded as a Living Weapon and being actively Commanded as a Pokemon, the user may Intercept for its Wielder as a Free Action." (`core/10-indices-and-reference.md`, line 2874-2878)
- **Implementation:** `canUseWeaponize()` in `living-weapon.service.ts:748-770` validates: has Weaponize ability, is wielded (found as `weaponId` in relationships), and is not fainted. `intercept-melee.post.ts:96-122` checks `isWeaponize` flag, validates with `canUseWeaponize()`, verifies target is the wielder, and skips normal Interrupt cost (line 112: "Skip normal eligibility check -- Weaponize is a Free Action"). Move log records `actionType: 'free'` (line 164).
- **Status:** CORRECT
  - Free Action cost: correctly bypasses Interrupt action economy.
  - Wielder-only: validates `wieldRel.wielderId === targetId` (line 106).
  - Fainted check: respects "actively Commanded" requirement via `relationship.isFainted`.
  - Adjacency: auto-satisfied since wielder and weapon share position (not explicitly checked, which is correct -- they are co-located).

### N. Soulstealer Ability -- Heal on Faint/Kill (PTU p.329)

- **Rule:** "The user's attack causes a foe to Faint -- remove one Injury and recover 25% of Maximum Hit Points. If the triggering attack killed its target, the user instead removes all Injuries and recovers all Hit Points." Scene frequency, Free Action. (`core/10-indices-and-reference.md`, line 2417-2423)
- **Implementation:** `checkSoulstealer()` in `living-weapon.service.ts:787-803` checks for the Soulstealer ability and target faint. `applySoulstealerHealing()` at lines 815-836 heals 25% max HP + removes 1 injury (faint) or full heal + all injuries (kill). Integrated in three endpoints:
  - `damage.post.ts:209-234` -- after faint from damage
  - `move.post.ts:243-264` -- after faint from move execution
  - `aoo-resolve.post.ts:183-197` -- after faint from AoO Struggle Attack
- **Status:** CORRECT (healing formula), with issues noted below.
  - 25% heal: `Math.floor(maxHp * 0.25)` matches PTU "25% of Maximum Hit Points" with floor rounding (PTU p.221: "Always round down").
  - Injury removal: correctly removes 1 injury on faint, all on kill.
  - HP cap: `Math.min(maxHp, currentHp + healAmount)` prevents overhealing.
  - Kill detection: deferred to GM input (`isKill: false` always). This is an acceptable limitation per design spec decision #7.
  - See HIGH-002 for scene frequency enforcement gap.

### Weapon Move DB Values (PTU pp.287-290)

- **Rule:** Small Melee Weapons raise DB by +1 (PTU p.287, line 1255). Base DBs: Wounding Strike 6, Double Swipe 4, Bleed! 9.
- **Implementation:** `livingWeapon.ts` constants: Wounding Strike DB 7, Double Swipe DB 5, Bleed! DB 10.
- **Status:** CORRECT -- all three include the +1 Small Melee modifier. AC values (2), frequencies (EOT/Scene x2), damage class (Physical), type (Normal), and ranges all match the rulebook definitions at pp.288-290.

### Movement Pool Reset

- **Rule:** PTU p.306 says "the total amount Shifted during the round cannot exceed the Wielder's Movement Speed" -- implying the pool resets each round.
- **Implementation:** `resetWieldMovementPools()` exists in `living-weapon.service.ts:661-668` but is **never called** from any round advancement code.
- **Status:** INCORRECT -- see HIGH-001.

### Decree Compliance

- **decree-043:** "Combat Skill Rank gates weapon move ACCESS, not engagement." The P2 code does not add or change engagement validation. The P1 `getGrantedWeaponMoves()` correctly gates moves by rank. Per decree-043, compliant.
- **decree-044:** No phantom Bound condition checks in P2 code. Compliant.
- **decree-001:** Soulstealer healing does not interact with the damage pipeline's minimum damage floor. Not applicable.

## Issues

### HIGH-001: Movement pool never resets at round start

**Mechanic:** Shared Movement Pool (Section J)
**Rule:** PTU p.306 -- "the total amount Shifted during the round cannot exceed the Wielder's Movement Speed." Per-round cap implies reset each round.
**Problem:** `resetWieldMovementPools()` is defined in `living-weapon.service.ts:661-668` but never called. Neither `next-turn.post.ts` nor `turn-helpers.ts` invoke it. The `movementUsedThisRound` counter will accumulate across rounds, eventually preventing all movement by the wielded pair.
**Impact:** After the first round, the wielder+weapon pair will have reduced or zero movement for all subsequent rounds. Functionally broken.
**Fix:** Call `resetWieldMovementPools()` at round boundary in `next-turn.post.ts` or `turn-helpers.ts`, analogous to how mount `movementRemaining` is reset in `resetCombatantsForNewRound`.

### HIGH-002: Soulstealer scene frequency not enforced

**Mechanic:** Soulstealer Ability (Section N)
**Rule:** "Scene -- Free Action" (`core/10-indices-and-reference.md`, line 2418). Soulstealer can trigger at most once per scene.
**Problem:** The implementation checks for ability and faint, but does not track or enforce the "Scene" frequency limit. `checkSoulstealer()` (`living-weapon.service.ts:787-803`) has no frequency check. All three integration points (`damage.post.ts`, `move.post.ts`, `aoo-resolve.post.ts`) will trigger Soulstealer on every faint caused by the attacker, not just the first per scene.
**Impact:** A Soulstealer Pokemon could heal on every faint it causes in a scene, significantly exceeding the intended 1/scene limit.
**Design spec acknowledgment:** The spec says "Track usage in the move log or on a per-scene counter" and `damage.post.ts` comments say "tracked via response annotation (GM enforces limit)." However, the actual healing is applied automatically server-side without any GM gate. The GM has no opportunity to prevent the second+ trigger.
**Fix:** Either (a) add a `soulstealerUsedThisScene` flag on the combatant/entity and check it before applying healing, or (b) make Soulstealer healing a two-step process where the server detects the trigger but the GM must confirm application (similar to dismount checks).

### MEDIUM-001: No Guard suppression only on server-side accuracy path

**Mechanic:** No Guard Suppression (Section K)
**Rule:** PTU p.306 -- No Guard suppressed while wielded.
**Problem:** `isNoGuardActive()` is called in `calculate-damage.post.ts:360` (server-side), but the client-side accuracy calculation in `useMoveCalculation.ts:427-439` (`getAccuracyThreshold`) does not check for No Guard at all. The client accuracy threshold will not reflect No Guard's -3 AC modifier whether active or suppressed.
**Impact:** The client-side move calculation panel will show incorrect accuracy thresholds for No Guard Pokemon. The authoritative server calculation is correct. Since the GM uses the server result for official resolution, this is a display issue rather than a game logic error.
**Fix:** If client-side accuracy display is used for GM decision-making, add No Guard awareness to `useMoveCalculation.ts`. Otherwise, document as known limitation.

### MEDIUM-002: Shared movement pool does not apply movement modifiers

**Mechanic:** Shared Movement Pool (Section J)
**Rule:** PTU p.306 -- "use the Wielder's Movement Speed to shift." Normal movement is subject to modifiers (Slowed, Stuck, Sprint, Speed CS).
**Problem:** The shared movement pool in `useGridMovement.ts:148-163` uses raw `getOverlandSpeed(wielder)` without applying movement modifiers (Slowed -1, Stuck 0, Speed CS multiplier, Sprint +50%). The mount system, by contrast, pre-applies modifiers to `movementRemaining` at round start. For wielded pairs, a Slowed wielder would still show full movement speed.
**Impact:** Status conditions and combat stage modifiers affecting movement will not reduce the shared pool for wielded pairs. This means a Slowed or Stuck wielder can still move at full speed when wielding a Living Weapon.
**Fix:** Apply `applyMovementModifiers()` to the wielder's speed when computing the shared pool ceiling, or pre-compute the modified speed at pool initialization (matching the mount pattern).

### MEDIUM-003: No Guard definition needs decree (pre-existing)

**Mechanic:** No Guard Ability
**Problem:** The core rulebook (p.325) defines No Guard as evasion-based (user cannot apply evasion to melee; user ignores evasion on melee attacks). The 2016 playtest packet (line 525) redefines it as +3/-3 to attack rolls. The implementation uses the playtest version (-3 AC reduction). No decree exists to formalize this choice. The Living Weapon suppression is consistent with whichever version is used (suppresses the entire ability), so this is not a P2 blocking issue, but a pre-existing ambiguity.
**Impact:** Without a decree, future implementers may use the wrong definition.
**Action:** File a `decree-need` ticket for the No Guard definition choice.

## Summary

The P2 implementation correctly implements the core PTU mechanics for Living Weapon: shared movement pooling, linked position sync, No Guard suppression, Aegislash forced Blade forme with stat swap, Weaponize Free Action intercept, and Soulstealer healing formulas. Weapon move DB values correctly include the Small Melee +1 modifier. Decree-043 compliance is maintained.

Two HIGH issues prevent approval:
1. The movement pool reset function exists but is never called, making the shared movement system non-functional after round 1.
2. Soulstealer healing fires on every qualifying faint with no scene frequency enforcement, despite being applied automatically server-side.

Three MEDIUM issues are flagged: client-side No Guard display gap, missing movement modifiers on the shared pool, and a pre-existing No Guard definition ambiguity needing a decree.

## Rulings

1. **Stance Change stat swap is correct.** `swapAegislashStance()` swaps Attack<->Defense and SpAtk<->SpDef, matching PTU p.330 exactly.
2. **Soulstealer 25% heal uses floor rounding.** `Math.floor(maxHp * 0.25)` is correct per PTU p.221 "always round down."
3. **Weaponize skipping adjacency check is correct.** Wielder and weapon share position, so adjacency is trivially satisfied.
4. **Kill detection deferral to GM is acceptable.** PTU kill rules are complex and GM-adjudicated. The placeholder `isKill: false` with manual override is a valid P2 approach.
5. **Aegislash blade forme heuristic (attack > defense) is acceptable for P2.** With base stats of 5 ATK / 15 DEF in Shield or 15 ATK / 5 DEF in Blade, the heuristic is reliable for unmodified stats. Edge cases with heavy CS investment are unlikely in practice.

## Verdict

**CHANGES_REQUIRED**

HIGH-001 and HIGH-002 must be resolved before approval. The movement pool reset is a functional correctness issue (system breaks after round 1). The Soulstealer frequency gap allows unlimited healing in violation of the Scene frequency.

## Required Changes

1. **HIGH-001:** Integrate `resetWieldMovementPools()` into the round advancement pipeline (`next-turn.post.ts` or `turn-helpers.ts`).
2. **HIGH-002:** Add scene frequency enforcement to `checkSoulstealer()` or gate Soulstealer healing behind GM confirmation.
3. **MEDIUM-002 (recommended):** Apply movement modifiers to wielder speed when computing the shared pool.
