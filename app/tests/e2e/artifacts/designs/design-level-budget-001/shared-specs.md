# Shared Specifications

## Relationship to ptu-rule-058 (Density/Significance)

ptu-rule-058 identifies that the app's density tier system controls spawn count, while PTU density should affect encounter significance and XP. This design does NOT change how density controls spawn count — that system works well for its purpose (determining how many Pokemon appear in a habitat).

Instead, this design adds the PTU budget system as a parallel, complementary layer:

- **Density** answers: "How many Pokemon live here?" (spawn count from habitat ecology)
- **Level Budget** answers: "Is this encounter appropriately difficult?" (difficulty from party context)
- **Significance** answers: "How much XP should this be worth?" (reward from narrative context)

The density-to-significance mapping from ptu-rule-058 can be addressed as a follow-up: a "suggested significance" that defaults based on density tier (sparse = x1, moderate = x1.5, dense = x2, abundant = x2.5). But this is a convenience suggestion, not a hard coupling.

---


## Existing Patterns to Follow

- **`app/utils/captureRate.ts`** — pure utility with typed I/O and breakdown, consumed by API endpoint. Same pattern for `encounterBudget.ts`.
- **`app/utils/damageCalculation.ts`** — same pure utility pattern, proven in design-testability-001.
- **`app/components/scene/StartEncounterModal.vue`** — existing modal to extend with significance and budget info.
- **`app/components/habitat/GenerateEncounterModal.vue`** — existing modal to extend with budget guidance.
- **`app/types/habitat.ts`** — existing encounter table types to reference (DensityTier, LevelRange).

---


## What NOT To Change

- **Density tier system** — spawn count logic in `generate.post.ts` is unchanged. Density remains a spawn count mechanism.
- **Encounter table structure** — no changes to EncounterTable, EncounterTableEntry, or TableModification models.
- **Existing encounter creation flow** — all current workflows continue to work. Budget is additive guidance, not a gate.
- **Template loading** — encounter templates do not need budget fields (budget is computed at load time from party context).
- **VTT grid** — no grid changes.

---


## Open Questions for Senior Reviewer

1. **Party context persistence**: Should the "average Pokemon level" and "player count" be stored as app settings (so the GM doesn't re-enter them each time), or computed dynamically from the player characters in the database? Dynamic is more accurate but requires players to be registered in the app. A settings-based approach is simpler and works even when players aren't fully set up in the system.

2. **Significance on completed encounters**: When an encounter ends, should the significance be locked (preventing post-hoc changes that would alter XP), or remain editable? PTU rules suggest the GM decides significance after the encounter based on how it played out. Recommendation: allow editing until XP is distributed, then lock.

3. **Budget source for wild encounters**: The table generation modal may not have party context (it's opened from the encounter tables page, not a scene). Should the budget section require manual input, or should the app maintain a "current party" concept that auto-populates? The manual input approach is simpler and avoids assumptions about which characters are "the party."

4. **Encounter budget as a stored field**: Should the budget be stored on the Encounter record (computed at creation, frozen), or always computed on-the-fly from current party data? Storing it preserves the GM's intent at creation time; computing it stays current. Recommendation: store it, since party levels change over the campaign.

---


## Implementation Notes

### Suggested Implementation Order

1. **P0: `app/utils/encounterBudget.ts`** — pure functions, unit-testable immediately
2. **P0: `app/composables/useEncounterBudget.ts`** — reactive wrapper
3. **P0: `app/components/encounter/BudgetIndicator.vue`** — reusable display component
4. **P0: Extend `GenerateEncounterModal.vue`** — add party context props and budget guide section
5. **P0: Extend `StartEncounterModal.vue`** — add budget summary row
6. **P1: Prisma migration** — add `significance` and `significanceTier` to Encounter model
7. **P1: Extend `StartEncounterModal.vue`** — add significance tier selector
8. **P1: Extend encounter APIs** — accept and store significance
9. **P1: Extend `GenerateEncounterModal.vue`** — add significance selector for wild encounters
10. **P2: Budget warnings** — add contextual warnings to encounter creation and mid-combat
11. **P2: Difficulty presets** — add quick-select buttons in GenerateEncounterModal

---

