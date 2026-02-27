---
id: ptu-rule-092
title: Pathetic skill enforcement gap in custom background mode
priority: P3
severity: MEDIUM
status: open
domain: character-lifecycle
source: character-lifecycle-audit.md (R024)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-092: Pathetic skill enforcement gap in custom background mode

## Summary

In custom background mode, `setSkillRank` allows raising Pathetic skills back to higher ranks without going through the Skill Edge path. Custom mode doesn't track which skills were lowered to Pathetic during background selection, so the enforcement boundary is bypassed.

## Affected Files

- `app/composables/useCharacterCreation.ts` (`setSkillRank` function)

## PTU Rule Reference

Pathetic skills: "A Pathetic Skill cannot be raised above its Pathetic Rank except by taking certain Edges."

## Suggested Fix

Track which skills were marked as Pathetic during background selection. In `setSkillRank`, check if the skill is Pathetic before allowing rank increases.

## Impact

Custom background mode allows bypassing the Pathetic skill restriction, making characters overpowered.
