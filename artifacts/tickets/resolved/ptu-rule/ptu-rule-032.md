---
ticket_id: ptu-rule-032
type: ptu-rule
priority: P2
status: resolved
source_ecosystem: verifier
target_ecosystem: dev
created_by: scenario-verifier
created_at: 2026-02-18T14:40:00
domain: healing
severity: MEDIUM
affected_files:
  - app/server/api/characters/[id]/heal-injury.post.ts
---

## Summary

AP drain injury healing incorrectly resets `lastInjuryTime` to `new Date()`, destroying the natural healing 24h timer. The `drain_ap` code path uses identical `lastInjuryTime` update logic as the `natural` path, but only natural healing should reset the timer.

## Details

In `heal-injury.post.ts`, the AP drain branch (line 69-78) includes:

```typescript
lastInjuryTime: newInjuries > 0 ? new Date() : null
```

This is the same line used in the natural healing branch (line 112-119). For natural healing, resetting the timer is intentional game balance (prevents chaining free heals). For AP drain, the reset is unintentional — it punishes players for using a mechanic that already has its own cost (2 AP per injury).

### Impact

If a character uses AP drain while waiting for natural healing eligibility (e.g., 20h into the 24h timer), their timer resets to 0, forcing another 24h wait. This discourages using AP drain alongside natural healing, which contradicts PTU's intent that AP drain is an alternative path with its own cost.

### Reproduction

1. Create character with injuries=2, lastInjuryTime=25h ago
2. Call `POST /api/characters/:id/heal-injury { method: "drain_ap" }`
3. Check character: `lastInjuryTime` is now (reset), not 25h ago (preserved)

## PTU Reference

PTU 1.05 p.252, Resting:
> "If a Pokemon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries."

The timer tracks **gaining** new injuries, not healing them. AP drain heals (removes) an injury — it should not reset a timer that monitors injury acquisition.

> "Trainers can also remove Injuries as an Extended Action by Draining 2 AP. This is subject to the limitations on healing Injuries each day."

No mention of AP drain affecting the natural healing timer.

## Fix

Remove `lastInjuryTime` from the AP drain update payload. Only update it when injuries reach 0 (set to null):

```typescript
if (method === 'drain_ap') {
  const newDrainedAp = character.drainedAp + 2
  const newInjuries = character.injuries - 1

  const updated = await prisma.humanCharacter.update({
    where: { id },
    data: {
      injuries: newInjuries,
      drainedAp: newDrainedAp,
      injuriesHealedToday: injuriesHealedToday + 1,
      lastRestReset: new Date(),
      // Only clear lastInjuryTime when all injuries are gone
      // Do NOT reset to now — AP drain should not affect the natural healing timer
      ...(newInjuries === 0 ? { lastInjuryTime: null } : {})
    }
  })
```

## Discovered By

Scenario Verifier during healing domain verification. `healing-ap-drain-injury-001` Test 4 asserts lastInjuryTime is preserved during AP drain — assertion is correct per PTU rules but fails against current app behavior.

## Fix Log

- **Commit:** `a84e7fd` — `fix: preserve lastInjuryTime during AP drain injury healing`
- **File changed:** `app/server/api/characters/[id]/heal-injury.post.ts` (line 76)
- **Change:** Replaced `lastInjuryTime: newInjuries > 0 ? new Date() : null` with conditional spread `...(newInjuries === 0 ? { lastInjuryTime: null } : {})` — AP drain no longer touches `lastInjuryTime` unless injuries reach 0 (then clears it).
- **Duplicate check:** Searched all `server/` files referencing `lastInjuryTime`. Pokemon heal-injury is natural-only (no AP drain path). Pokemon-center endpoints correctly preserve the value. `entity-update.service.ts` only sets it on injury gain. No duplicates found.
