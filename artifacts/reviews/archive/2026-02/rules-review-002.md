---
review_id: rules-review-002
review_type: ptu-rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-001
domain: combat
commits_reviewed:
  - 72df77b
  - 84b9f6c
  - b9dfed7
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/services/entity-update.service.ts
mechanics_verified:
  - status-clearing-on-faint
  - faint-detection
  - damage-pipeline-consistency
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_references:
  - "core/07-combat.md p246 (line 1534-1536): 'All Persistent Status conditions are cured if the target is Fainted.'"
  - "core/07-combat.md p247 (line 1580-1581): 'When Pokémon are Fainted, they are automatically cured of all Volatile Status Afflictions.'"
  - "core/07-combat.md p248 (line 1691-1692): 'When a Pokémon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions.'"
  - "core/07-combat.md p248 (line 1653-1654): 'Temporary Hit Points are always lost first from damage or any other effects.'"
scenarios_to_rerun:
  - combat-workflow-faint-replacement-001
reviewed_at: 2026-02-16T06:30:00
---

## Review Scope

PTU rules correctness review for bug-001 fix: when a Pokemon fainted (HP reached 0), the "Fainted" status was appended to `statusConditions` without clearing pre-existing Persistent and Volatile statuses. Three commits reviewed: core fix (72df77b), guard simplification (84b9f6c), and `move.post.ts` pipeline adoption (b9dfed7).

## Mechanics Verified

### 1. Status Clearing on Faint

- **Rule:** PTU p248 line 1691-1692: "When a Pokémon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." Corroborated by p246 line 1534-1536 (Persistent section) and p247 line 1580-1581 (Volatile section). Three independent rulebook references, all consistent.
- **Persistent statuses (p246):** Burned, Frozen, Paralysis, Poisoned, Badly Poisoned, Asleep
- **Volatile statuses (p247):** Confused, Flinched, Infatuated, Cursed, Disabled, Encored, Enraged, Bad Sleep, Suppressed, Taunted, Tormented
- **Implementation (72df77b):** `entity.statusConditions = ['Fainted']` — replaces entire array, clearing all prior statuses and setting only Fainted.
- **Status:** CORRECT — All Persistent and Volatile conditions are cleared in a single assignment.

### 2. Faint Guard Simplification

- **Rule:** The Fainted condition is binary — a Pokemon either is Fainted or is not. There is no stacking or double-Faint in PTU.
- **Implementation (84b9f6c):** Removed `!entity.statusConditions?.includes('Fainted')` guard. The check was redundant — `entity.statusConditions = ['Fainted']` is idempotent and produces the correct array regardless of prior state.
- **Status:** CORRECT — The old guard was dead logic. Assigning `['Fainted']` always produces the right result whether or not Fainted was already present.

### 3. Faint Detection

- **Rule:** PTU p248 line 1680: "A Pokémon or Trainer that is at 0 Hit Points or lower is Fainted."
- **Implementation:** `const fainted = newHp === 0` in `calculateDamage()`, with `newHp = Math.max(0, currentHp - hpDamage)`. Since HP is clamped to 0, `newHp === 0` is equivalent to "0 or lower."
- **Status:** CORRECT

### 4. Damage Pipeline Consistency (move.post.ts)

- **Rule (Temp HP):** PTU p248 line 1653-1654: "Temporary Hit Points are always lost first from damage."
- **Rule (Massive Damage):** PTU injury system: 50%+ of max HP in a single hit = 1 Injury.
- **Rule (Faint):** p248: HP reaches 0 → Fainted → all Persistent/Volatile cleared.
- **Previous implementation:** `move.post.ts` used `Math.max(0, currentHp - damage)` inline — missing temp HP absorption, massive damage injuries, and faint detection entirely.
- **New implementation (b9dfed7):** Uses `calculateDamage()` → `applyDamageToEntity()` → `syncDamageToDatabase()`, matching the established pattern in `damage.post.ts` exactly.
- **Status:** CORRECT — Both damage code paths (`damage.post.ts` and `move.post.ts`) now use the same pipeline. Verified parameter-by-parameter:
  - `calculateDamage(targetDamage, entity.currentHp, entity.maxHp, entity.temporaryHp || 0, entity.injuries || 0)` — matches `damage.post.ts`
  - `applyDamageToEntity(target, damageResult)` — same function, same signature
  - `syncDamageToDatabase(target, damageResult.newHp, damageResult.newTempHp, damageResult.newInjuries, entity.statusConditions || [], damageResult.injuryGained)` — matches `damage.post.ts`
  - Status conditions are read AFTER `applyDamageToEntity` mutates them, so faint-cleared statuses sync correctly to DB.

### 5. No Other Damage Paths

- Confirmed (per code-review-002): grep for `currentHp` mutations across `server/api/` found no other endpoints performing inline HP subtraction. `damage.post.ts` and `move.post.ts` are the only two server-side damage paths, and both now use the pipeline.

## Edge Cases Checked

### "Other Afflictions" Over-Clearing

The `VALID_STATUS_CONDITIONS` list includes Stuck, Slowed, Trapped, Tripped, Vulnerable — categorized as "Other Afflictions" in PTU p248 (line 1675-1679: "do not count as true 'Status Afflictions'"). The faint rule specifically says "Persistent and Volatile" (line 1692), not "Other Afflictions."

The implementation clears ALL statuses including these. This is technically slightly overinclusive. However:

1. A Fainted Pokemon cannot take any actions (p248 line 1682-1683), so Stuck/Slowed/Tripped/Vulnerable have no effect while Fainted.
2. Trapped ("cannot be recalled") is moot — the app handles faint replacement without recall mechanics.
3. If revived, the physical context causing these conditions (terrain entanglement, trip state) would not logically persist through faint + revival.

**Ruling:** No practical gameplay impact. The overinclusion is acceptable. Not flagged as an issue.

### HP Floor

PTU does not define negative HP tracking. The implementation clamps to 0 via `Math.max(0, ...)`. Correct.

### Healing Interaction

`applyHealingToEntity()` in `combatant.service.ts` correctly removes only the "Fainted" status when healing from 0 HP to positive HP (line 131-136), using a filter. It does NOT restore previously cleared statuses — which is correct, since PTU says they are "cured" (permanently removed).

## Issues

### CRITICAL

(none)

### HIGH

(none)

### MEDIUM

(none)

### Informational

1. **`move.post.ts` missing defeated enemy XP tracking** — noted in code-review-002. Not a PTU rules issue; this is a feature gap. Outside this review's scope.

## Summary

- Mechanics checked: 5
- Correct: 5
- Incorrect: 0
- Needs review: 0

## Verdict

APPROVED — All three commits correctly implement PTU 1.05 fainting rules. The core fix (status clearing) is directly supported by three independent rulebook references. The guard simplification is logically sound. The pipeline adoption in `move.post.ts` eliminates an entire class of PTU-incorrect behavior (missing temp HP, massive damage, and faint detection) and aligns both damage code paths to a single correct implementation.

## Scenarios to Re-run

- `combat-workflow-faint-replacement-001`: Directly tests the fix — assertion #8 verifies "Burned" is cleared when Caterpie faints.
