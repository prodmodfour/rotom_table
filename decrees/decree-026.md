---
decree_id: decree-026
status: active
domain: character-lifecycle
topic: martial-artist-not-branching
title: "Remove Martial Artist from branching classes (align with PTU RAW)"
ruled_at: 2026-02-27T21:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-026
implementation_tickets:
  - ptu-rule-115
tags: [character-lifecycle, branch-classes, martial-artist, trainer-classes]
---

# decree-026: Remove Martial Artist from branching classes

## The Ambiguity

Decree-022 listed Martial Artist alongside Type Ace, Stat Ace, Style Expert, and Researcher as a branching class. However, PTU Core p.161 tags Martial Artist as `[Class]` only — it does NOT have the `[Branch]` tag. The Ability choice (Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician) is an internal feature selection made when the class is taken, not a branching specialization that allows the class to be taken multiple times.

Surfaced by rules-review-176, recorded as decree-need-026.

## Options Considered

### Option A: Remove from branching (align with PTU RAW)
Remove Martial Artist from the branching class list. The `isBranching` flag and `BRANCHING_CLASS_SPECIALIZATIONS` entry are incorrect. Martial Artist is taken once, and the Ability choice is part of the class's internal mechanics.

Pros: Matches PTU RAW exactly. Simpler implementation — one less branching class to handle.
Cons: None significant. The Ability choice can still be tracked as a feature of the class without branching.

### Option B: Keep as branching (override RAW)
Treat the Ability choice as a branch specialization, allowing Martial Artist to be taken multiple times with different fighting styles.

Pros: More character variety.
Cons: Contradicts PTU RAW. The Ability choice doesn't function like a branch — it unlocks different move pools within the same class, not a parallel progression.

## Ruling

**The true master decrees: Martial Artist is NOT a branching class. Remove it from branching class handling.**

Martial Artist's `[Class]` tag (PTU Core p.161) means it can only be taken once. The Ability choice (Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician) is an internal feature selection — not a `[Branch]` specialization. The `isBranching: true` flag and `BRANCHING_CLASS_SPECIALIZATIONS['Martial Artist']` entry in `trainerClasses.ts` are incorrect and must be removed. Decree-022's preamble text must be corrected to remove Martial Artist from the branching classes list.

## Precedent

Only classes with the explicit `[Branch]` tag in PTU Core may be treated as branching classes. Internal feature choices within a `[Class]`-only class do not constitute branching. The canonical branching classes are: Type Ace, Stat Ace, Style Expert, and Researcher.

## Implementation Impact

- Tickets created: ptu-rule-115 (remove Martial Artist from branching class data)
- Files affected: `app/constants/trainerClasses.ts` (isBranching flag, BRANCHING_CLASS_SPECIALIZATIONS), decree-022 (preamble text correction)
- Skills affected: Character lifecycle reviewers should verify only 4 branching classes remain
