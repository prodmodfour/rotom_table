---
id: decree-need-045
title: "No Guard ability definition: core (evasion-based) vs playtest (+3/-3 attack rolls)"
priority: low
severity: medium
status: open
domain: combat
source: rules-review-294
created_by: game-logic-reviewer
created_at: 2026-03-04T12:15:00Z
affected_files:
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/server/services/living-weapon.service.ts
tags: [no-guard, ability, accuracy, evasion, playtest, living-weapon]
---

## Summary

The No Guard ability has two different definitions in the PTU source material, and the codebase uses one without a decree to formalize the choice.

## Problem

**Core rulebook (p.325):** "The user may not apply any form of Evasion to avoiding Melee attacks; however, the user ignores all forms of evasion when making Melee attack rolls."
- This is evasion-based: user loses melee evasion, opponent loses melee evasion against user.
- Only affects Melee attacks.

**Playtest packet 2016 (line 525):** "The user gains a +3 bonus to all Attack Rolls; however all foes gain a +3 Bonus on Attack Rolls against the user."
- This is a flat +3/-3 to accuracy, affecting all attacks (not just melee).

**Current implementation:** Uses the playtest version. `calculate-damage.post.ts:361` applies `-3` to the move's AC when No Guard is active. This is equivalent to the playtest's "+3 bonus to Attack Rolls."

**Authority chain concern:** Per CLAUDE.md, the authority chain is decrees > errata > core text. The playtest packet is not errata. Without a decree, the core text should take precedence, which would require a fundamentally different implementation (evasion zeroing for melee rather than flat AC modifier).

## Notes

- Living Weapon suppression (PTU p.306) works identically regardless of which definition is used -- it suppresses the entire ability.
- This is a pre-existing issue not introduced by feature-005 P2.
- The current playtest-based implementation is simpler and arguably more balanced.
- A decree is needed to formalize the choice and prevent future confusion.
- Only Honedge and Doublade have No Guard as Basic Ability 1. Aegislash has Stance Change instead.

## Discovered During

rules-review-294, feature-005 P2 review. The No Guard suppression implementation is correct for whichever version is chosen; the ambiguity is about the base ability definition itself.
