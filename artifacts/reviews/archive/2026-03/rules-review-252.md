---
review_id: rules-review-252
review_type: rules
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-014
domain: vtt-grid, combat
commits_reviewed:
  - 12b28670
  - 981cdfb7
  - 35bffb0c
  - ee1a050f
  - 38988c9c
  - c50258ff
  - bed9ff3b
  - 40d2f9e8
  - 092929fa
files_reviewed:
  - app/composables/useFlankingDetection.ts
  - app/utils/flankingGeometry.ts
  - app/composables/useMoveCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/components/encounter/CombatantCard.vue
  - app/pages/gm/index.vue
  - app/server/routes/ws.ts
  - app/composables/useWebSocket.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T14:35:00Z
follows_up: rules-review-248
---

## Review Scope

PTU rules compliance review for P2 of feature-014 (VTT Flanking Detection). P2 adds:
- Auto-detection of flanking state on token movement (Section I)
- Server-side flanking penalty in the `calculate-damage` endpoint (Section J)
- CombatantCard flanking indicator badge (Section K)
- WebSocket flanking state sync (Section L)

The core flanking geometry (P0) and multi-tile support (P1) were approved in rules-review-230 and rules-review-248 respectively. This review focuses on whether P2 automation correctly applies the rules already validated.

## PTU Rules Verified

### PTU p.232: Flanking Evasion Penalty (-2)

> "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion."

**Server-side implementation** (`calculate-damage.post.ts`): The `getFlankingPenaltyForTarget` function computes flanking using `checkFlankingMultiTile` from `flankingGeometry.ts` (the full P1 multi-tile algorithm). It returns `FLANKING_EVASION_PENALTY` (2) when the target is flanked, applied as `effectiveEvasionWithFlanking = Math.max(0, effectiveEvasion - flankingPenalty)`.

**Correctness:** The -2 penalty is correctly applied to ALL evasion types (Physical, Special, Speed) because it is applied to the `effectiveEvasion` value, which is already the `Math.max` of the applicable evasion type and Speed evasion. Per PTU p.232, flanking reduces "their Evasion" (all types), so applying it after the best-evasion selection is correct -- whichever evasion the defender chooses, it is reduced by 2.

**Client-side implementation** (`useMoveCalculation.ts` line 404): Same logic -- `effectiveEvasion - flankingPenalty` applied after `Math.min(9, evasion)` cap.

**Verdict:** Correctly implements the -2 evasion penalty. Both client and server agree on the formula.

### Decree-040: Penalty Ordering (Post-Cap)

> "The flanking -2 evasion penalty applies AFTER the evasion cap of 9."

**Server:** `effectiveEvasion = Math.min(9, applicableEvasion)` then `effectiveEvasionWithFlanking = Math.max(0, effectiveEvasion - flankingPenalty)`. The cap is applied first, then the penalty subtracts from the capped value.

**Client:** `effectiveEvasion = Math.min(9, evasion)` then `effectiveEvasion - flankingPenalty` in the threshold formula.

**Verdict:** Both implementations comply with decree-040. The comment in `useMoveCalculation.ts` (line 401-402) explicitly cites decree-040.

### PTU p.232: Flanking Requirements by Size

The server-side `getFlankingPenaltyForTarget` delegates to `checkFlankingMultiTile`, which uses `FLANKING_FOES_REQUIRED` (1:2, 2:3, 3:4, 4:5). This is the same algorithm validated in rules-review-248 (P1). No changes to the core algorithm in P2.

### PTU p.232: Self-Flank Prevention

> "A single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone."

The server-side uses `checkFlankingMultiTile` which enforces `adjacentFoes.length < 2` as an early exit. This was validated in rules-review-248.

### Dead/Fainted Exclusion

The server-side `getFlankingPenaltyForTarget` filters out dead and fainted combatants (lines 137-143):
```typescript
const isDead = conditions.includes('Dead')
const isFainted = conditions.includes('Fainted')
return hp > 0 && !isDead && !isFainted
```

This matches the client-side logic in `useFlankingDetection.ts` (lines 73-77). Dead and fainted combatants cannot participate in flanking (they are not threats on the battlefield). The design spec Section J only checked for `Dead` and `hp > 0`, but the developer correctly added the `Fainted` check for consistency. This is a defense-in-depth improvement -- `hp > 0` already covers most Fainted cases, but explicit Fainted exclusion handles edge cases where a combatant might be marked Fainted via status condition before their HP is actually set to 0.

### PTU p.234: Speed Evasion Selection

The server-side accuracy calculation correctly selects the best evasion (`Math.max(matchingEvasion, speedEvasion)`) before applying the evasion cap and flanking penalty. This means a flanked defender still benefits from Speed Evasion if it exceeds their type-matched evasion, but the flanking penalty reduces whichever they choose. This is correct per PTU p.234: "the Trainer may instead choose to use their Pokémon's Speed Evasion."

### Auto-Detection Timing

The `useFlankingDetection` watcher uses `{ deep: true }` on the `flankingMap` computed property. Since `flankingMap` recomputes whenever `positionedCombatants` changes (which depends on combatant positions from the reactive combatants ref), flanking state updates immediately when tokens move. This is correct -- PTU flanking is a positional state that should update in real-time.

## Edge Cases Considered

1. **Combatant with no position:** Both client and server check `position != null` before including a combatant in flanking calculations. Non-positioned combatants (not placed on the VTT grid) are excluded. This is correct -- flanking requires grid positions.

2. **Non-VTT encounters:** The server-side `getFlankingPenaltyForTarget` returns 0 if the target has no position. Encounters without grid placement will never have flanking applied. Correct.

3. **Client-server consistency:** Both the GM client (via `useFlankingDetection` + `useMoveCalculation`) and the server (via `calculate-damage.post.ts`) use the same flanking algorithm (`checkFlankingMultiTile`), the same filtering criteria (alive, positioned, enemy), and the same penalty application order (per decree-040). The results will be consistent.

## Rules Not Yet Implemented (Acknowledged, Out of Scope)

The following PTU mechanics interact with flanking but are not part of the feature-014 design spec:

- **Flutter Ability** (PTU Ability Index): "cannot be Flanked" -- would need a flanking immunity check
- **Whirlwind Strikes** (PTU p.162): "You do not count as Flanked for one full round"
- **Gymnast's Tumbler** (PTU p.165): "You don't count as Flanked"
- **Dynamic Punch** (PTU Move Index): "ignores the target's Evasion if they are Flanked" -- would need special handling beyond the -2 penalty

These are future feature scope items, not P2 regressions.

## Verdict

**APPROVED**

The P2 implementation correctly applies PTU flanking rules. The -2 evasion penalty is accurately computed on both client and server, decree-040 penalty ordering is respected, dead/fainted exclusion is properly handled, and Speed Evasion selection interacts correctly with the flanking penalty. No rules issues found.
