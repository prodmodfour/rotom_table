---
ticket_id: ptu-rule-034
type: ptu-rule
priority: P2
status: in-progress
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-18T15:40:00
domain: healing
severity: MEDIUM
affected_files:
  - app/server/api/characters/[id]/heal-injury.post.ts
  - app/server/api/pokemon/[id]/heal-injury.post.ts
---

## Summary

Natural healing incorrectly resets `lastInjuryTime` to `new Date()` after each heal, enforcing "24h since last natural heal" instead of the PTU rule "24h without gaining any new injuries." This prevents chain-healing multiple injuries once the 24h window is met (up to the 3/day cap).

## Details

Both character and Pokemon natural healing paths reset the timer after each heal:

**Character** (`heal-injury.post.ts:118`):
```typescript
lastInjuryTime: newInjuries > 0 ? new Date() : null
```

**Pokemon** (`pokemon/heal-injury.post.ts:83`):
```typescript
lastInjuryTime: newInjuries > 0 ? new Date() : null
```

### What the code does

After naturally healing 1 injury, the timer resets to now. The character must wait another 24h before healing the next injury. With 3 injuries, it takes 72h (3 x 24h) to heal all three naturally.

### What PTU says

PTU 1.05 p.252 (`core/07-combat.md`, lines 2004-2008):
> "If a Pokemon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries."

The 24h timer tracks when injuries are **gained** (through damage, falling, etc.), not when they are **healed**. Once 24h have passed since the last injury was gained, the condition is met. Healing an injury is not gaining one, so the condition remains met. The character should be able to heal additional injuries immediately (up to the 3/day cap from all sources).

### Correct behavior

After 24h with no new injuries, a character with 3 injuries can heal up to 3 in one session (the daily cap). The timer should only be set to `new Date()` when an injury is **gained** (which already happens correctly in `entity-update.service.ts:96`), not when one is healed.

## Fix

Remove `lastInjuryTime` from the natural healing update payload. Only clear it when injuries reach 0 (same pattern as the AP drain fix in `a84e7fd`):

```typescript
// In both character and pokemon heal-injury.post.ts natural paths:
data: {
  injuries: newInjuries,
  injuriesHealedToday: injuriesHealedToday + 1,
  lastRestReset: new Date(),
  // Only clear when all injuries gone. Do NOT reset timer — healing is not gaining.
  ...(newInjuries === 0 ? { lastInjuryTime: null } : {})
}
```

## PTU Reference

- `core/07-combat.md` p.252, lines 2004-2008: Natural injury healing rule
- `entity-update.service.ts:96`: Correctly sets `lastInjuryTime` only on injury **gain** — the natural heal path should be consistent with this

## Discovered By

Game Logic Reviewer during rules-review-037 (ptu-rule-032 AP drain fix review). Pre-existing issue in both character and Pokemon natural healing endpoints.

## Fix Log

- **Fixed by:** Developer
- **Files changed:**
  - `app/server/api/characters/[id]/heal-injury.post.ts` — removed `lastInjuryTime: new Date()` reset from natural healing path; now only clears to `null` when injuries reach 0
  - `app/server/api/pokemon/[id]/heal-injury.post.ts` — same fix
- **Pattern:** Matches the drain_ap path (already correct since `a84e7fd`) — uses spread conditional `...(newInjuries === 0 ? { lastInjuryTime: null } : {})` instead of resetting the timer
