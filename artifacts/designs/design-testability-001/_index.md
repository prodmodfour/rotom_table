---
design_id: design-testability-001
gap_report: rules-review-test-integrity-001
category: FEATURE_GAP
scope: PARTIAL
domain: combat
scenario_id: (17+ combat spec files — all damage-formula tests are tautological)
loop_id: combat
status: implemented
affected_files:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/move.post.ts
new_files:
  - app/utils/damageCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
---


# Design: Server-Side Combat Calculations for Testability

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Damage Calculation Endpoint (P0) | [spec-p0.md](spec-p0.md) |
| P1 | B. Evasion Recalculation During Combat (P1) | [spec-p1.md](spec-p1.md) |
| P2 | C. HP Marker Injury Detection (P2) | [spec-p2.md](spec-p2.md) |

## Summary

Add a pure-function damage calculation utility (`damageCalculation.ts`) and a REST endpoint (`POST /api/encounters/:id/calculate-damage`) that computes the full PTU 9-step damage formula server-side. This converts 17+ tautological test files into genuine end-to-end tests by giving the server the ability to compute damage, STAB, type effectiveness, stage multipliers, evasion, and critical hits — rather than echoing client-sent numbers.

The capture rate system (`captureRate.ts` + `POST /api/capture/rate`) is the proven architectural pattern: a pure utility with typed input/output and a full breakdown, consumed by a thin API endpoint.

---

## Priority Map

| # | Mechanic | Current Status | Server Gap | Priority |
|---|----------|---------------|------------|----------|
| A | Damage formula (9-step) | TESTED_TAUTOLOGICAL | No compute endpoint | **P0** |
| B | STAB (+2 DB) | TESTED_TAUTOLOGICAL | No server code | P0 (part of A) |
| C | Type effectiveness | TESTED_TAUTOLOGICAL | No server type chart | P0 (part of A) |
| D | Stage multiplier → stat | NOT_TESTED (multiplier→damage) | Storage only, no multiplication | P0 (part of A) |
| E | Critical hit damage | NOT_TESTED | Client-only | P0 (part of A) |
| F | Evasion recalculation | TESTED_TAUTOLOGICAL | Static after creation | **P1** |
| G | HP marker injuries | NOT_TESTED | Server clamps HP >= 0 | **P2** |

Items A–E are delivered together as a single endpoint. F and G are independent enhancements.

---


## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [implementation-log.md](implementation-log.md)
