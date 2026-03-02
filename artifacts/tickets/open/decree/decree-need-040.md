---
title: "Awakening item not in PTU 1.05 — house-rule sleep cure inclusion?"
priority: P2
severity: MEDIUM
domain: healing
source: code-review-278 MED-2 + rules-review-254 HIGH-1
created_by: slave-collector (plan-20260302-130300)
created_at: 2026-03-02
---

# decree-need-040: Awakening item inclusion

## Question

Should the Awakening item (a cheap $200 targeted sleep cure) be included in the healing item catalog? PTU 1.05 deliberately omits a standalone sleep cure item. The only ways to cure Sleep in PTU RAW are:
- Full Heal ($800) — cures all status conditions
- Full Restore ($3000) — cures all conditions + full HP
- Natural recovery (wake check each turn)

## Context

Feature-020 P1 (Healing Item System) added Awakening as a status cure item at $200. Both code-review-278 (MED-2) and rules-review-254 (HIGH-1) flag this as not present in PTU 1.05. The absence of a cheap sleep-specific cure is a deliberate PTU design choice that makes Sleep a more impactful condition.

Adding Awakening at $200 significantly changes the item economy around Sleep — a condition that PTU balances as one of the most powerful status effects (decree-038 already rules that Sleep persists through recall and encounter end).

## Options

1. **Remove Awakening** — strict PTU RAW compliance. Players must use Full Heal ($800) or wait for natural recovery.
2. **Keep Awakening as house rule** — more player-friendly, but weakens Sleep as a tactical condition.
3. **Keep Awakening at higher price** (e.g., $600) — compromise that preserves some Sleep economy.

## Impact

Affects healing item catalog in `app/constants/healingItems.ts` and all related tests. If removed, the fix is simple (delete one entry). If kept, tests and review must be updated to acknowledge house-rule status.
