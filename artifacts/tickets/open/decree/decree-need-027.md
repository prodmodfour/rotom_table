---
id: decree-need-027
title: "Can Skill Edges raise Pathetic skills during character creation?"
priority: P3
severity: HIGH
status: open
domain: character-lifecycle
topic: pathetic-skill-edge-raw-conflict
source: rules-review-179 HIGH-01
created_by: slave-collector (plan-20260227-210000)
created_at: 2026-02-27
---

# decree-need-027: Can Skill Edges raise Pathetic skills during character creation?

## Ambiguity

PTU RAW is self-contradictory on whether Skill Edges can raise Pathetic-locked skills during character creation:

- **PTU p.14:** "These Pathetic Skills cannot be raised above Pathetic during character creation." (no exception clause)
- **PTU p.18 (Quick-Start):** "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank."
- **PTU p.41 (Basic Skills Edge):** "You Rank Up a Skill from Pathetic to Untrained, or Untrained to Novice."

Pages 14 and 18 explicitly forbid raising Pathetic skills by any means, including Edges. Page 41 explicitly includes Pathetic-to-Untrained as a valid progression for Basic Skills Edge.

## Current Implementation

The current code (ptu-rule-092 fix) sides with p.41, treating Skill Edges as the exception that allows Pathetic skills to be raised. The `addSkillEdge` function allows Pathetic → Untrained progression.

## Options

1. **Allow Skill Edges to raise Pathetic skills** (current implementation, aligns with p.41 Basic Skills Edge description)
2. **Block Skill Edges from raising Pathetic skills** (aligns with p.14 and p.18 verbatim text)

## Impact

Affects `app/composables/useCharacterCreation.ts` — the `addSkillEdge` function's handling of Pathetic-ranked skills.
