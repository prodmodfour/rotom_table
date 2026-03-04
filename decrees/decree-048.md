---
decree_id: decree-048
status: active
domain: encounter-tables
topic: dark-cave-blindness-penalties
title: "Use RAW flat Blindness/Total Blindness penalties with two separate cave presets"
ruled_at: 2026-03-04T00:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-047
implementation_tickets:
  - ptu-rule-134
  - feature-025
tags: [blindness, accuracy, environment-preset, dark-cave, darkvision, blindsense]
---

# decree-048: Use RAW Flat Blindness/Total Blindness Penalties with Two Separate Cave Presets

## The Ambiguity

The Dark Cave environment preset applied a flat -2 accuracy penalty via `accuracyPenaltyPerMeter: -2`, but PTU RAW defines Blindness as -6 and Total Blindness as -10 (flat penalties). The field name suggested per-meter scaling but distance was never calculated. Surfaced by rules-review-302 HIGH-1.

## Options Considered

### Option A: RAW Flat Penalties
Use PTU RAW values (-6 Blindness, -10 Total Blindness) as flat accuracy penalties. Simple, rules-accurate, GM can override.

### Option B: Homebrew Per-Meter Scaling
Actually implement distance-based calculation with per-meter multiplier. More granular but deviates from RAW and adds significant complexity.

### Option C: Simplified Flat Penalty
A middle-ground house rule (e.g., -3 or -4). Less harsh than RAW but more impactful than the current -2.

## Ruling

**The true master decrees: Use RAW flat penalties and split into two separate presets — "Dim Cave" (Blindness, -6) and "Dark Cave" (Total Blindness, -10).**

The current -2 flat penalty significantly under-penalizes darkness compared to RAW and could mislead GMs. The app should ship with rules-accurate defaults. A "Dim Cave" preset covers partial darkness (Blindness, -6 accuracy), while "Dark Cave" covers complete darkness (Total Blindness, -10 accuracy, plus no map awareness and no Priority/Interrupt moves per RAW). The `accuracyPenaltyPerMeter` field should be replaced with a flat `accuracyPenalty` value. GMs can still adjust or dismiss effects.

Additionally, per-combatant Darkvision/Blindsense tracking should be implemented as a future feature so the app can automatically negate darkness penalties for combatants with those capabilities.

## Precedent

Environment presets must use RAW values by default. When RAW defines multiple severity tiers for a condition, provide separate presets for each tier rather than inventing a single simplified value. Per-combatant capability tracking is the correct long-term approach for condition negation.

## Implementation Impact

- Tickets created: ptu-rule-134 (split presets + RAW penalties), feature-025 (per-combatant vision tracking)
- Files affected: `app/constants/environmentPresets.ts`, `app/types/encounter.ts`, `app/composables/useMoveCalculation.ts`
- Skills affected: Developer, Senior Reviewer, Game Logic Reviewer
