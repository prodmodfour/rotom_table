---
review_id: rules-review-307
review_type: rules
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-050
domain: combat
commits_reviewed:
  - c3b07416
files_reviewed:
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/utils/damageCalculation.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T19:30:00Z
follows_up: null
---

## Review Scope

First rules review of bug-050: server-side `calculate-damage.post.ts` was not passing `moveKeywords` to the 9-step damage calculator, preventing the Weapon keyword STAB exclusion from firing on the server-side path.

## Rules Compliance

### PTU p.287 -- Weapon Moves and STAB

PTU p.287 states that weapon moves "can never benefit from STAB." The `calculateDamage()` function implements this at line 332-334 of `damageCalculation.ts`:

```typescript
const isWeaponMove = input.moveKeywords?.includes('Weapon') ?? false
const stabApplied = !isWeaponMove && hasSTAB(input.moveType, input.attackerTypes)
```

Before this fix, the server-side endpoint omitted `moveKeywords` from the input, causing `isWeaponMove` to resolve to `false` for all moves (including actual weapon moves). This meant weapon moves could incorrectly receive +2 DB from STAB if the move type matched the attacker's type.

The fix correctly passes `moveKeywords: move.keywords` so the Weapon keyword is available to the STAB check. This brings the server-side path into compliance with PTU p.287.

### decree-043 -- Living Weapon Skill Rank Gate

decree-043 rules that Combat Skill Rank gates Living Weapon move access, not engagement. This decree concerns which moves a wielder can use (skill rank prerequisite), not STAB calculation. Not directly applicable to this fix, but noted for completeness since both involve the Living Weapon system.

## Verdict

**APPROVED** -- Fix correctly implements PTU p.287 weapon move STAB exclusion on the server-side damage calculation path. The rule was already correctly implemented in the calculator itself; this fix ensures the endpoint passes the necessary data through.
