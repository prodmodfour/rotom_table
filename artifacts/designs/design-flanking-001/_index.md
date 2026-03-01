---
design_id: design-flanking-001
ticket_id: feature-014
category: FEATURE
scope: FULL
domain: vtt-grid+combat
status: designed
decree: decree-002, decree-003
affected_files:
  - app/composables/useGridMovement.ts
  - app/composables/useMoveCalculation.ts
  - app/composables/useGridRendering.ts
  - app/composables/useCanvasDrawing.ts
  - app/components/encounter/CombatantCard.vue
  - app/components/vtt/VTTToken.vue
  - app/stores/encounter.ts
  - app/utils/combatSides.ts
  - app/utils/gridDistance.ts
  - app/types/combat.ts
new_files:
  - app/composables/useFlankingDetection.ts
  - app/utils/flankingGeometry.ts
---

# Design: VTT Flanking Detection

## Summary

Implement PTU flanking detection on the VTT grid. When a combatant is adjacent to two or more non-adjacent foes (scaling with size: 2 for Small/Medium, 3 for Large, 4 for Huge, 5 for Gigantic), they are Flanked and suffer a -2 evasion penalty to all accuracy checks against them. The system provides real-time visual indicators on the grid and auto-applies the penalty to accuracy calculations.

## PTU Rules (Chapter 7, p.232)

> "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion."

> "A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other."

> "For Large Trainers and Pokemon, the requirement is three foes meeting those conditions. The requirement increases to four for Huge and five for Gigantic sized combatants."

> "Foes larger than Medium may occupy multiple squares -- in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying."

> "However, a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone."

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Flanking geometry utility, B. 1x1 flanking detection composable, C. Visual indicator on VTT, D. Flanking evasion penalty in accuracy | [spec-p0.md](spec-p0.md) |
| P1 | E. Multi-tile target flanking geometry, F. Multi-tile attacker counting, G. Diagonal flanking with PTU distance, H. 3+ attacker flanking | [spec-p1.md](spec-p1.md) |
| P2 | I. Auto-detect flanking on token placement/movement, J. Auto-apply penalty to accuracy checks, K. Flanking indicator in CombatantCard, L. WebSocket flanking sync | [spec-p2.md](spec-p2.md) |

## Dependencies

- **decree-002**: PTU alternating diagonal for all grid distance measurements
- **decree-003**: All tokens passable; enemy-occupied squares are rough terrain (affects adjacency -- enemies on adjacent squares are valid flankers)
- **feature-013** (P1 only): Multi-tile token system required for Large+ combatant flanking geometry

## Priority Map

| # | Mechanic | Current Status | Gap | Priority |
|---|----------|---------------|-----|----------|
| A | Flanking geometry utility (pure math) | NOT_IMPLEMENTED | No adjacency-based flanking logic | **P0** |
| B | 1x1 flanking detection composable | NOT_IMPLEMENTED | No flanking detection | **P0** |
| C | Visual indicator on VTT grid | NOT_IMPLEMENTED | No flanking visual feedback | **P0** |
| D | Flanking evasion penalty in accuracy | NOT_IMPLEMENTED | No -2 evasion penalty | **P0** |
| E | Multi-tile target flanking geometry | NOT_IMPLEMENTED | Depends on feature-013 | **P1** |
| F | Multi-tile attacker counting | NOT_IMPLEMENTED | Large attackers count as multiple foes | **P1** |
| G | Diagonal flanking with PTU distance | NOT_IMPLEMENTED | Adjacency uses Chebyshev, decree-002 applies | **P1** |
| H | 3+ attacker flanking | NOT_IMPLEMENTED | More than 2 flankers | **P1** |
| I | Auto-detect on token movement | NOT_IMPLEMENTED | No reactive flanking state | **P2** |
| J | Auto-apply penalty to accuracy checks | NOT_IMPLEMENTED | Manual flanking tracking | **P2** |
| K | Flanking indicator in CombatantCard | NOT_IMPLEMENTED | No flanking status display | **P2** |
| L | WebSocket flanking sync | NOT_IMPLEMENTED | GM-only detection, not synced | **P2** |

---

## Atomized Files

- [_index.md](_index.md)
- [shared-specs.md](shared-specs.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [testing-strategy.md](testing-strategy.md)
