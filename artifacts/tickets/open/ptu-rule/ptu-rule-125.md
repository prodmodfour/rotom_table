---
ticket_id: ptu-rule-125
title: "Populate grantedCapabilities on all capability-granting catalog entries"
priority: P4
severity: LOW
domain: character-lifecycle
source: code-review-222 M-02 + rules-review-198 MED-02
created_by: slave-collector (plan-20260228-153856)
created_at: 2026-02-28
status: in-progress
---

# ptu-rule-125: Populate grantedCapabilities on all capability-granting catalog entries

## Summary

Several equipment catalog entries grant capabilities per PTU rules but do not use the `grantedCapabilities` field introduced in ptu-rule-120. Their effects are only described in the `description` string. For catalog consistency and future extensibility, all capability-granting items should populate `grantedCapabilities`.

## PTU References

- Dark Vision Goggles: "grant the Darkvision Capability while worn" (PTU p.293, `core/09-gear-and-items.md`)
- Re-Breather: "grants the Gilled Capability for up to an hour" (PTU p.293)
- Gas Mask: immunity to powder/gas moves (PTU p.293)

## Affected Files

- `app/constants/equipment.ts` — Add `grantedCapabilities` to Dark Vision Goggles, Re-Breather, Gas Mask entries

## Suggested Fix

```typescript
// Dark Vision Goggles
grantedCapabilities: ['Darkvision']

// Re-Breather
grantedCapabilities: ['Gilled']

// Gas Mask — capability-like effect, decide on naming convention
grantedCapabilities: ['Gas Mask Immunity']
```

## Impact

Low — these capabilities (Darkvision, Gilled) have no mechanical impact in the current combat/VTT systems. This is a catalog completeness improvement for display consistency in the equipment UI bonuses section.

## Resolution Log

- **Commit:** 0cd02f3a — `feat: populate grantedCapabilities on capability-granting equipment`
- **Files changed:** `app/constants/equipment.ts`
- **What was done:**
  - Added `grantedCapabilities: ['Darkvision']` to Dark Vision Goggles
  - Added `grantedCapabilities: ['Gas Mask Immunity']` to Gas Mask
  - Added Re-Breather as new head slot entry with `grantedCapabilities: ['Gilled']`, cost $4000 (PTU p.293)
