---
review_id: rules-review-299
review_type: rules
reviewer: game-logic-reviewer
trigger: refactoring
target_report: refactoring-106
domain: combat
commits_reviewed:
  - b5d5af8e
  - 1a57b6a1
  - c00b1460
  - 4f2eabd6
  - 3971e97b
  - ed906a60
  - ff64a2a7
  - fb01f6a2
mechanics_verified:
  - status-condition-categories
  - recall-condition-clearing
  - encounter-end-condition-clearing
  - faint-condition-clearing
  - breather-condition-clearing
  - capture-rate-status-modifiers
  - rest-healing-persistent-clearing
  - sleep-persistence
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#persistent-afflictions
  - core/07-combat.md#volatile-afflictions
  - core/07-combat.md#page-248-fainted
  - core/07-combat.md#page-245-take-a-breather
  - core/07-combat.md#page-252-resting
  - core/05-pokemon.md#capture-rate
reviewed_at: 2026-03-04T15:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. StatusConditionDef Type and Per-Condition Behavior Flags
- **Rule:** Per decree-038: "Each condition should have independent behavior flags (e.g., clearsOnRecall, clearsOnEncounterEnd, clearsOnFaint) so that category is used only for display grouping, not behavior derivation."
- **Implementation:** `app/constants/statusConditions.ts` defines `StatusConditionDef` interface with `category` (display only), `clearsOnRecall`, `clearsOnEncounterEnd`, and `clearsOnFaint` boolean flags. `STATUS_CONDITION_DEFS` is a `Record<StatusCondition, StatusConditionDef>` providing the single source of truth for all 20 conditions.
- **Status:** CORRECT. The type definition cleanly separates display category from behavioral flags, exactly as decree-038 requires.

### 2. Sleep and Bad Sleep Persistence (decree-038 / ptu-rule-128)
- **Rule:** decree-038 ruling: "Sleep does NOT clear on recall or encounter end. This matches mainline Pokemon video game behavior." PTU p.247 classifies Sleep under Volatile Afflictions. decree-038 keeps that classification for display but decouples the clearing behavior.
- **Implementation:** `Asleep` and `Bad Sleep` have `category: 'volatile'` (correct per PTU p.247 placement), `clearsOnRecall: false`, `clearsOnEncounterEnd: false`, `clearsOnFaint: true`. Bad Sleep comment correctly notes it shares Sleep's persistence behavior and clears when Sleep is cured (PTU p.247: "if the target is cured of Sleep, they are also cured of Bad Sleep").
- **Status:** CORRECT. Sleep remains volatile for UI grouping. The `false` flags for recall and encounter end implement decree-038's binding ruling. `clearsOnFaint: true` is correct per PTU p.248: "cured of all Persistent and Volatile Status Conditions" (Sleep is volatile, so faint clears it).

### 3. Recall Condition Clearing
- **Rule:** PTU p.247: "Volatile Afflictions are cured completely... from Pokemon by recalling them into their Poke Balls." PTU p.247-248: Slowed and Stuck "may be removed by switching." PTU p.246: "Persistent Afflictions are retained even if the Pokemon is recalled." Trapped prevents recall entirely (p.247).
- **Implementation:** `RECALL_CLEARED_CONDITIONS` is derived via `ALL_CONDITION_DEFS.filter(d => d.clearsOnRecall)`. This produces: Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed (volatile minus Sleep/Bad Sleep), plus Stuck, Slowed, Tripped, Vulnerable (other conditions with clearsOnRecall=true). Used by `switching.service.ts:applyRecallSideEffects()`.
- **Status:** CORRECT. Volatile conditions (except Sleep/Bad Sleep per decree-038) clear on recall. Persistent conditions do not. Slowed and Stuck clear per RAW. Trapped has `clearsOnRecall: false` (correctly prevents recall via separate Trapped check in switching.service.ts). Tripped and Vulnerable clearing on recall is a reasonable interpretation — these are transient combat conditions with no RAW text suggesting they persist through recall.

### 4. Encounter-End Condition Clearing
- **Rule:** PTU p.247: "Volatile Afflictions are cured completely at the end of the encounter." No explicit RAW text for other conditions at encounter end, but combat-scoped conditions logically expire.
- **Implementation:** `ENCOUNTER_END_CLEARED_CONDITIONS` derived from `clearsOnEncounterEnd` flags. Includes all volatile (except Sleep/Bad Sleep), plus Stuck, Slowed, Trapped, Tripped, Vulnerable. Used by `end.post.ts:clearEncounterEndConditions()`.
- **Status:** CORRECT. Volatile conditions (minus Sleep/Bad Sleep per decree-038) clear at encounter end per RAW. Trapped clearing at encounter end is correct — Trapped prevents recall during combat (p.247) but has no reason to persist after combat ends. Other combat conditions (Stuck, Slowed, Tripped, Vulnerable) clearing at encounter end is a sound interpretation.

### 5. Faint Condition Clearing
- **Rule:** PTU p.248: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." Also p.247: "When Pokemon are Fainted, they are automatically cured of all Volatile Status Afflictions."
- **Implementation:** `FAINT_CLEARED_CONDITIONS` derived from `clearsOnFaint` flags. Includes all persistent (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned), all volatile (including Asleep and Bad Sleep), and other combat conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable). Excludes Fainted and Dead (self-referential). Used by `combatant.service.ts:applyFaintStatus()` which also reverses CS effects from cleared conditions (per decree-005).
- **Status:** CORRECT. PTU RAW explicitly says "all Persistent and Volatile" clear on faint. Sleep and Bad Sleep have `clearsOnFaint: true` — correct, since they ARE volatile and faint clears all volatile. The inclusion of other conditions (Stuck, Slowed, etc.) on faint is reasonable — a fainted entity has no meaningful use for these conditions. The CS effect reversal integration with decree-005 is properly maintained.

### 6. Breather Condition Clearing
- **Rule:** PTU p.245: "cured of all Volatile Status effects and the Slow and Stuck conditions. To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters."
- **Implementation:** `breather.post.ts` derives `BREATHER_CURED_CONDITIONS` from `STATUS_CONDITION_DEFS` using `d.category === 'volatile' && d.name !== 'Cursed'` plus hardcoded Slowed and Stuck. This means Sleep and Bad Sleep (volatile) ARE cured by Take a Breather.
- **Status:** CORRECT. Take a Breather cures "all Volatile Status effects" per PTU p.245. Sleep is volatile (per decree-038's explicit categorization). There is nothing in decree-038 that exempts Sleep from Take a Breather — decree-038 only addresses recall and encounter end persistence. A deliberate in-combat Full Action to reset should cure Sleep. The breather correctly uses category (volatile) rather than behavioral flags here, because the PTU breather rule IS category-based ("all Volatile Status effects").

### 7. Capture Rate Status Modifiers
- **Rule:** PTU p.214 (05-pokemon.md): "Persistent Conditions add +10 to the Pokemon's Capture Rate; Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5."
- **Implementation:** `captureRate.ts` iterates conditions, looks up `STATUS_CONDITION_DEFS[condition]`, checks `def.category === 'persistent'` for +10 and `def.category === 'volatile'` for +5. Stuck (+10) and Slowed (+5) handled separately. Poison/Badly Poisoned deduplication correctly applies +10 only once.
- **Status:** CORRECT. Sleep (volatile) gives +5 to capture rate, which aligns with PTU RAW since Sleep IS categorized as volatile. The implementation correctly uses `category` (not behavioral flags) for capture rate, because the PTU capture rate rule IS category-based. Per decree-038, category is authoritative for this purpose.

### 8. Rest Healing — Extended Rest Persistent Clearing
- **Rule:** PTU p.252: "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP."
- **Implementation:** `restHealing.ts:getStatusesToClear()` and `clearPersistentStatusConditions()` use `category === 'persistent'` to identify conditions cleared by Extended Rest.
- **Status:** CORRECT. Extended Rest specifically targets persistent conditions per RAW. Sleep (volatile) would NOT be cleared by Extended Rest, which is correct — Extended Rest does not mention volatile conditions. Under decree-038, Sleep persists through encounter end, so a Pokemon could still be Asleep when reaching Extended Rest. Sleep would then only be curable by: save checks (DC 16), taking damage, items, or Pokemon Center. This is consistent with decree-038's intent to make Sleep meaningful and persistent.

### 9. Derived Array Consumers — No Stale Category References
- **Rule:** decree-038: "condition behaviors must be decoupled from category arrays."
- **Implementation:** Checked all imports of `VOLATILE_CONDITIONS`, `PERSISTENT_CONDITIONS`, `OTHER_CONDITIONS` across the codebase. Only consumer is `CombatantConditionsSection.vue` (UI display grouping) — exactly the intended use case. All game logic consumers now use either behavior-derived arrays (`RECALL_CLEARED_CONDITIONS`, `ENCOUNTER_END_CLEARED_CONDITIONS`, `FAINT_CLEARED_CONDITIONS`) or `STATUS_CONDITION_DEFS` directly for category-based rules (capture rate, rest healing, breather).
- **Status:** CORRECT. No game logic consumer uses category arrays for behavioral decisions. The decoupling is complete.

## Summary

The refactoring-106 + ptu-rule-128 implementation is clean and correct. The `StatusConditionDef` type with per-condition behavior flags achieves the architectural goal of decree-038: category is for display only, behaviors are specified independently per condition. All six consumers (encounter end, faint, breather, capture rate, rest healing, recall/switching) have been updated to use the appropriate data source — behavior-derived arrays for clearing logic, category for rule-based modifiers (capture rate, rest healing, breather). Sleep and Bad Sleep correctly remain volatile but do not clear on recall or encounter end, matching decree-038's binding ruling.

The implementation demonstrates good judgment in choosing when to use behavioral flags vs. category: the capture rate, extended rest, and breather rules are inherently category-based in PTU RAW (they reference "Persistent Conditions" or "Volatile Status effects" directly), so using `def.category` is correct for those consumers. Only the recall, encounter-end, and faint clearing logic needed the behavioral flag decoupling, because that's where Sleep's exception matters.

## Rulings

No new rulings required. All mechanics correctly implement existing PTU RAW and decree-038.

## Verdict

**APPROVED** — No issues found. The implementation correctly decouples status condition behaviors from category arrays per decree-038, correctly makes Sleep/Bad Sleep persist through recall and encounter end while remaining volatile for display, and introduces no regressions in any of the six consumer sites.

## Required Changes

None.
