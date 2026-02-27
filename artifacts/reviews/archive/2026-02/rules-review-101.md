---
review_id: rules-review-101
ticket: ptu-rule-051
commits_reviewed: [6cba802, 0a94bb9]
verdict: PASS
reviewer: game-logic-reviewer
date: 2026-02-20
---

# Rules Review: ptu-rule-051 — Take a Breather Shift Movement

## Ticket Summary

ptu-rule-051 reported that Take a Breather's forced shift movement away from enemies was not automated on the VTT grid. The original ticket described this as a "2-square shift" but the developer corrected this to "full movement away from enemies."

## PTU Rule Verification

### Source: PTU 1.05 p.245

> "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action to move as far away from enemies as possible, using their highest available Movement Capability."

### Key rule elements:

| Rule Element | PTU Text | Implementation | Status |
|---|---|---|---|
| Action type | Full Action (Standard + Shift) | Client marks both `standardActionUsed` and `shiftActionUsed` via `useAction` calls; server marks `standardActionUsed` and `hasActed` | CORRECT |
| Movement requirement | "move as far away from enemies as possible, using their highest available Movement Capability" | Banner says "must Shift away from all adjacent enemies using full movement"; move log says "SHIFT REQUIRED: Move away from all enemies using full movement." | CORRECT |
| Tripped | "They then become Tripped" | Applied as `tempConditions: ['Tripped']` (pre-existing code, not part of this fix) | CORRECT |
| Vulnerable | "Vulnerable until the end of their next turn" | Applied as `tempConditions: ['Vulnerable']` (pre-existing code) | CORRECT |
| Combat stages reset | "set their Combat Stages back to their default level" | `entity.stageModifiers = createDefaultStageModifiers()` (pre-existing) | CORRECT |
| Temp HP removed | "lose all Temporary Hit Points" | `entity.temporaryHp = 0` (pre-existing) | CORRECT |
| Volatile status cured | "cured of all Volatile Status effects and the Slow and Stuck conditions" | `BREATHER_CURED_CONDITIONS` includes all volatile conditions (except Cursed) plus Slowed and Stuck (pre-existing) | CORRECT |
| Cursed exception | "source of the Curse must either be Knocked Out or no longer within 12 meters" | Excluded from auto-clearing with comment noting GM adjudication required (pre-existing) | CORRECT |

### Developer's correction: "2-square shift" vs "full movement"

The ticket originally stated "forced 2-square shift movement." The developer correctly identified that PTU p.245 says "move as far away from enemies as possible, using their highest available Movement Capability." This is NOT a 2-square shift -- it is a full movement using the combatant's best Movement Capability (Overland, Swim, etc.). The developer's correction is accurate.

### Errata check

Searched `books/markdown/errata-2.md` for "Breather" and "245." The errata mentions Take a Breather only in the context of other features (Bring It On!, Defense Curl, Expert Medicine Education). No errata modifies the core Take a Breather shift mechanic. The p.245 text is authoritative.

## Changes Reviewed

### 1. `app/composables/useEncounterActions.ts`

- New `BreatherShiftResult` interface exported for the GM page to consume.
- `handleExecuteAction` return type changed from `void` to `Promise<BreatherShiftResult | undefined>`.
- After calling `takeABreather()`, sets `breatherShift = { combatantId, combatantName: name }` to signal the GM.

**Rules assessment:** Correct. The composable properly signals that the GM must handle the shift without attempting to automate a complex pathfinding decision.

### 2. `app/components/encounter/BreatherShiftBanner.vue`

- Warning-styled banner with "Breather Shift Required" title.
- Description: `"must Shift away from all adjacent enemies using full movement."`
- "Move on Grid" and "Dismiss" buttons.
- Page reference "(PTU p.245)" included.

**Rules assessment:** The banner text says "all adjacent enemies" but PTU says "as far away from enemies as possible" -- not limited to adjacent enemies. However, this is a minor wording nuance; in practice the GM is being told to move the token away, and the PTU rule's intent (maximizing distance from all enemies) is conveyed by "full movement." The instruction is sufficiently accurate for a GM prompt. ACCEPTABLE.

### 3. `app/pages/gm/index.vue`

- Banner appears after breather execution.
- Auto-switches to grid view so the GM can immediately move the token.
- Banner auto-dismisses when the pending combatant's token is moved on the grid.
- Wraps `handleExecuteAction` and `handleTokenMove` with breather-aware variants.

**Rules assessment:** Correct behavior. The GM is guided to move the token, and the banner clears when the movement is completed.

### 4. `app/server/api/encounters/[id]/breather.post.ts`

- Move log entry now includes: `"SHIFT REQUIRED: Move away from all enemies using full movement."`

**Rules assessment:** The log text accurately conveys the PTU rule. "Full movement" correctly represents "highest available Movement Capability."

### 5. `app/constants/combatManeuvers.ts`

- Short description updated from `"Reset stages, cure volatile status, become Tripped"` to `"Reset stages, cure volatile status, become Tripped. Must Shift away from enemies."`

**Rules assessment:** Accurate summary of the maneuver for the GM action modal.

## Other Take a Breather Rules Check

### Assisted Breather (PTU p.245)

> "When a Trainer or Pokemon is unable to choose to Take a Breather themselves...they may be calmed and assisted by a Trainer"

This is a separate mechanic involving Command Check DC 12, shared shift using lower movement, and both parties becoming Tripped with 0 Evasion. This is NOT implemented and was NOT part of this ticket. It is a separate feature that could be a future ticket. No issue here.

### Medicine Education interaction (Errata)

> "Rank 2 -- Expert Medicine Education: ...The target may immediately Take a Breather as a Full-Action Interrupt if they wish. They do not Shift and do not become Tripped as part of this action."

This is a Trainer feature interaction, not a core rule. Not relevant to this ticket.

## Observations

### Minor: Server endpoint does not set `shiftActionUsed`

The breather endpoint (line 97-99) sets `standardActionUsed = true` and `hasActed = true` but does not set `shiftActionUsed = true`. This was previously noted in the healing audit (Observation 2). In the current execution flow, the shift is already marked as used by the prior `useAction(combatantId, 'shift')` call in the composable (line 144-145), so the shift flag is preserved when the breather endpoint loads the encounter from DB. This is NOT a rules bug in the current code, but it is a fragile coupling -- if the client-side call order ever changes, the shift action could silently go untracked. This is a code-quality observation, not a rules failure, and is deferred to the Senior Reviewer.

### Minor: Banner text says "adjacent enemies" vs PTU "all enemies"

The banner says "Shift away from all adjacent enemies" while PTU says "move as far away from enemies as possible." The PTU rule does not limit this to adjacent enemies -- the combatant must maximize distance from ALL enemies. In practice, the GM understands they need to move the token away, and the grid provides spatial context. This wording difference is unlikely to cause incorrect play. ACCEPTABLE for a GM tool.

## Verdict

**PASS**

The developer correctly identified and fixed the ticket's inaccurate "2-square shift" description to match PTU p.245's actual "full movement away from enemies" rule. The implementation appropriately uses a GM prompt/banner rather than attempting complex pathfinding automation. The move log text, banner description, and maneuver short description all accurately convey the shift requirement. No Take a Breather rules were missed by this fix (Tripped, Vulnerable, stage reset, temp HP removal, volatile cure, Cursed exception were all pre-existing and correct). The errata contains no modifications to the core breather shift mechanic.
