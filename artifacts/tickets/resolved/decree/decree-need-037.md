---
ticket_id: decree-need-037
priority: P3
status: addressed
domain: combat
source: rules-review-212 MEDIUM-001
created_by: slave-collector (plan-20260301-093000)
created_at: 2026-03-01
decree_id: decree-038
---

# Decree Needed: Sleep/Asleep Classification — Volatile or Persistent?

## Ambiguity

PTU p.246 lists Sleep under "Persistent Afflictions" with the text: "Persistent Afflictions are retained even if the Pokemon is recalled into its Poke Ball. Sleeping Pokemon will naturally awaken given time."

However, the codebase classifies `Asleep` as a volatile condition in `VOLATILE_CONDITIONS` (`constants/statusConditions.ts` line 12). Since `RECALL_CLEARED_CONDITIONS` includes all of `VOLATILE_CONDITIONS`, recalling a sleeping Pokemon currently **cures** its Sleep condition — which contradicts PTU RAW.

## Options

1. **Reclassify as Persistent (PTU RAW):** Move `Asleep` and `Bad Sleep` from `VOLATILE_CONDITIONS` to `PERSISTENT_CONDITIONS`. Recalling a sleeping Pokemon keeps Sleep. Matches the rulebook exactly.

2. **Keep as Volatile (Gameplay Convenience):** Sleep is cured on recall, matching video game behavior. The PTU text says Sleep is persistent, but the practical effect at the table may be more fun if it's curable by recall.

## Impact

Affects multiple systems:
- `RECALL_CLEARED_CONDITIONS` (switching recall)
- Encounter-end cleanup (volatile conditions cleared)
- Pokemon Center healing (clears everything)
- Status automation tick (sleep turn counting)

## PTU References

- `core/07-combat.md#page-246`: "Persistent Afflictions" heading includes Sleep
- `core/07-combat.md#page-247`: "Volatile Afflictions are cured completely... by recalling them into their Poke Balls"

## Requesting

Human ruling on whether `Asleep`/`Bad Sleep` should be classified as persistent (PTU RAW) or volatile (gameplay convenience) in this system.

## Resolution

Addressed by decree-038. Sleep stays volatile (per p.247 structural placement) but does NOT clear on recall or encounter end (per video game behavior). Condition behaviors decoupled from category arrays via refactoring-106. Sleep-specific fix in ptu-rule-128.
