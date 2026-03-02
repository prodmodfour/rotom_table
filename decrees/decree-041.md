---
decree_id: decree-041
status: active
domain: healing
topic: awakening-item-inclusion
title: "Keep Awakening at $200 as a standard single-condition cure item"
ruled_at: 2026-03-02T18:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-040
implementation_tickets: []
tags: [healing, items, awakening, sleep, status-cure, ptu-errata]
---

# decree-041: Keep Awakening at $200 as a standard single-condition cure item

## The Ambiguity

Feature-020 P1 (Healing Item System) added an Awakening item at $200 that cures Sleep. Both code-review-278 (MED-2) and rules-review-254 (HIGH-1) flagged this as not present in the PTU 1.05 gear table (ch9 p.276). The question: is the omission deliberate (making Sleep harder to cure) or an editing oversight?

Source: decree-need-040, surfaced by code-review-278 MED-2 and rules-review-254 HIGH-1.

## Options Considered

### Option A: Keep Awakening at $200
The ch9 omission is an editing error. Two other PTU 1.05 chapters confirm the item exists: the Pharmacy stock list (ch11) and the Apothecary class Restorative Science recipe (ch4). Every other single-condition cure (Antidote, Paralyze Heal, Burn Heal, Ice Heal) is $200. Pros: RAW-consistent across the full book, consistent pricing. Cons: none — this is the intended behavior.

### Option B: Remove Awakening (strict ch9 only)
Only include items explicitly in the ch9 gear table. Sleep curable only by Full Heal ($450) or Full Restore ($1450). Pros: strict reading of one chapter. Cons: contradicts two other chapters in the same book, makes Sleep dramatically harder to cure than any other condition without clear design intent.

### Option C: Keep at higher price ($350-400)
Compromise pricing to reflect Sleep's power. Pros: acknowledges Sleep's strength (per decree-038). Cons: no PTU basis for differential pricing — all single-condition cures are $200, and the book references Awakening alongside them without price distinction.

## Ruling

**The true master decrees: keep Awakening at $200 as a standard single-condition cure item, treating the ch9 gear table omission as an editing oversight.**

Evidence:
- PTU 1.05 ch11 (Running the Game, Pharmacy stock list) explicitly lists "Awakenings" as a commonly stocked item alongside Antidotes, Burn Heals, and Ice Heals.
- PTU 1.05 ch4 (Trainer Classes, Apothecary — Restorative Science recipe) explicitly lists "Awakening" as a craftable item in the same tier as Antidote, Paralyze Heal, Burn Heal, and Ice Heal.
- Every other single-condition cure is $200. The Awakening fits the same pattern.
- The errata does not address this discrepancy, but two independent references to the item elsewhere in the book confirm its intended existence.

## Precedent

When a PTU item is missing from one reference table but explicitly referenced by name in multiple other chapters of the same book (shop stock lists, class features), treat the table omission as an editing error and include the item. Cross-reference multiple chapters before concluding an item is "deliberately omitted."

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: `app/constants/healingItems.ts` (Awakening already correctly included at $200)
- Skills affected: reviewers should cite this decree and stop flagging Awakening as non-RAW
