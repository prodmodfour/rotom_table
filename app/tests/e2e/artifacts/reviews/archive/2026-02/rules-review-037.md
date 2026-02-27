---
review_id: rules-review-037
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-032
domain: healing
commits_reviewed:
  - a84e7fd
mechanics_verified:
  - ap-drain-lastInjuryTime-preservation
  - ap-drain-clear-on-zero-injuries
  - ap-drain-daily-limit
  - ap-drain-cost
  - natural-heal-lastInjuryTime-reset
  - pokemon-center-drainedAp-restoration
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Resting (p.252, lines 2004-2008)
  - core/07-combat.md#Pokemon-Centers (p.252, lines 2015-2028)
  - core/07-combat.md#Extended-Rests (p.252, lines 2009-2014)
  - errata-2.md (no relevant changes)
reviewed_at: 2026-02-18T15:40:00
---

## Review Scope

Review of commit `a84e7fd` (fix: preserve lastInjuryTime during AP drain injury healing) for ticket `ptu-rule-032`. Single file changed: `app/server/api/characters/[id]/heal-injury.post.ts`, line 76. Verified the fix against PTU 1.05 p.252 Resting rules and cross-referenced all server-side `lastInjuryTime` and related healing field usage sites.

## Mechanics Verified

### 1. AP Drain Should Not Reset lastInjuryTime (COMMITTED FIX)
- **Rule:** "If a Pokemon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries." (`core/07-combat.md`, p.252, lines 2004-2005)
- **Implementation (before fix):** AP drain path set `lastInjuryTime: newInjuries > 0 ? new Date() : null` — resetting the timer to now on every AP drain heal.
- **Implementation (after fix):** AP drain path uses `...(newInjuries === 0 ? { lastInjuryTime: null } : {})` — timer is untouched unless injuries reach 0 (then cleared).
- **Status:** CORRECT
- **Rationale:** The 24h timer tracks when injuries are **gained**, not healed. AP drain removes injuries; it does not cause new ones. The fix correctly preserves `lastInjuryTime` during AP drain.

### 2. Clear lastInjuryTime When Injuries Reach Zero (COMMITTED FIX)
- **Rule:** The 24h timer has no meaning when there are no injuries to heal.
- **Implementation:** `...(newInjuries === 0 ? { lastInjuryTime: null } : {})` — sets to null only when all injuries are gone.
- **Status:** CORRECT

### 3. Daily Injury Healing Limit Applies to AP Drain (PRE-EXISTING)
- **Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP. This is subject to the limitations on healing Injuries each day." + "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total." (`core/07-combat.md`, p.252, lines 2007-2008, 2026-2028)
- **Implementation:** `injuriesHealedToday >= 3` check at line 53 gates both natural and AP drain paths.
- **Status:** CORRECT

### 4. AP Drain Costs 2 AP Per Injury (PRE-EXISTING)
- **Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP." (`core/07-combat.md`, p.252, line 2007)
- **Implementation:** `newDrainedAp = character.drainedAp + 2` at line 66.
- **Status:** CORRECT

### 5. Natural Healing Resets lastInjuryTime After Each Heal (PRE-EXISTING)
- **Rule:** "they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries." (`core/07-combat.md`, p.252, lines 2004-2005)
- **Implementation:** Both character (`heal-injury.post.ts:118`) and Pokemon (`pokemon/heal-injury.post.ts:83`) set `lastInjuryTime: newInjuries > 0 ? new Date() : null` after natural healing.
- **Status:** INCORRECT
- **Severity:** MEDIUM
- **Issue:** The 24h timer tracks injury **acquisition**, not healing. After naturally healing 1 injury, if no new injuries were gained, the 24h condition is still met. The code resets the timer to now, enforcing "24h since last heal" instead of "24h since last injury gained." With 3 injuries, this forces 72h (3 x 24h) instead of allowing up to 3 heals in one session (per the daily cap). The fix should use the same pattern as the AP drain fix: `...(newInjuries === 0 ? { lastInjuryTime: null } : {})`.
- **Ticket filed:** `ptu-rule-034`

### 6. Pokemon Center Unconditionally Restores Drained AP (PRE-EXISTING)
- **Rule (Pokemon Centers):** "Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves." (`core/07-combat.md`, p.252, lines 2017-2020) — no mention of AP restoration.
- **Rule (Extended Rests):** "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP." (`core/07-combat.md`, p.252, lines 2009-2011)
- **Implementation:** Character Pokemon Center endpoint (`pokemon-center.post.ts:76`) sets `drainedAp: 0` unconditionally.
- **Status:** INCORRECT
- **Severity:** MEDIUM
- **Issue:** Drained AP restoration is an **Extended Rest** benefit (4+ continuous hours), not a Pokemon Center benefit. A base Pokemon Center visit takes 1 hour, well below the Extended Rest threshold. The code gives free AP restoration for every Pokemon Center visit regardless of time spent. The developer's duplicate check claimed "Pokemon-center endpoints correctly preserve the value" — the `lastInjuryTime` handling is correct, but the `drainedAp: 0` is a separate PTU violation.
- **Ticket filed:** `ptu-rule-035`

## Cross-Reference: All lastInjuryTime Write Sites

| Location | Behavior | Correct? |
|----------|----------|----------|
| `entity-update.service.ts:96` | `injuryGained ? new Date() : undefined` — only sets on injury **gain** | Yes |
| `heal-injury.post.ts:76` (AP drain, **this fix**) | Preserved unless injuries=0, then null | Yes |
| `heal-injury.post.ts:118` (natural) | Reset to `new Date()` after each heal | **No** — see ptu-rule-034 |
| `pokemon/heal-injury.post.ts:83` (natural) | Reset to `new Date()` after each heal | **No** — see ptu-rule-034 |
| `pokemon-center.post.ts:78` (character) | Preserved unless injuries=0, then null | Yes |
| `pokemon/pokemon-center.post.ts:89` (pokemon) | Preserved unless injuries=0, then null | Yes |
| `pokemon-generator.service.ts:294` | `null` on creation (no injuries) | Yes |

## Summary
- Mechanics checked: 6
- Correct: 4
- Incorrect: 2 (both pre-existing, not introduced by this commit)
- Needs review: 0

## Verdict
APPROVED — The committed fix (`a84e7fd`) correctly implements the PTU rule that AP drain should not affect the natural healing 24h timer. The change is minimal (1 line), targeted, and correct. Two pre-existing MEDIUM issues were found in adjacent code and ticketed: natural healing timer reset (ptu-rule-034) and Pokemon Center AP restoration (ptu-rule-035). Neither was introduced by this commit.

## Required Changes
None for this commit. Pre-existing issues tracked in:
- `ptu-rule-034`: Natural healing incorrectly resets `lastInjuryTime` (2 files)
- `ptu-rule-035`: Pokemon Center incorrectly restores drained AP (1 file)
