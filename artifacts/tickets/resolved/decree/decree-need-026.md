---
id: decree-need-026
title: Is Martial Artist a branching class?
domain: character-lifecycle
topic: martial-artist-branch-status
source: rules-review-176
created_by: slave-collector (plan-20260227-190000)
status: addressed
decree_id: decree-026
---

## Summary

decree-022 lists Martial Artist as a branching class: "PTU allows [Branch] classes (Type Ace, Stat Ace, Style Expert, Researcher, Martial Artist)". However, PTU Core p.161 tags Martial Artist as `[Class]` only — there is NO `[Branch]` tag. The errata does not change this.

Compare:
- Type Ace: `[Class] [Branch]` (p.119)
- Stat Ace: `[Class] [Branch]` (p.112)
- Style Expert: `[Class] [Branch]` (p.115)
- Researcher: `[Class][Branch]` (p.140)
- **Martial Artist: `[Class]`** (p.161) — no `[Branch]`

Martial Artist requires choosing an Ability (Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician) when the class is taken, but this is an internal feature choice, not a branching specialization. Per PTU RAW, the class cannot be taken multiple times.

## Question for Human

Should Martial Artist be treated as a branching class (per current decree-022) or a non-branching class (per PTU RAW)?

**Option A:** Remove Martial Artist from branching classes (align with PTU RAW). Update decree-022 to remove Martial Artist from the list.

**Option B:** Keep Martial Artist as branching (override PTU RAW). The specialization values would need to be corrected to the actual Ability choices: Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician.

## Impact

- `app/constants/trainerClasses.ts` — `isBranching` flag and `BRANCHING_CLASS_SPECIALIZATIONS` entry
- decree-022 — preamble text listing branching classes
- ptu-rule-091 fix cycle — the developer needs the ruling before fixing HIGH-002
