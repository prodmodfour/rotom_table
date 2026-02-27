---
review_id: code-review-050
type: code-review
status: completed
verdict: APPROVED
reviewed_commits:
  - 65d8fa8
  - 3b5ede0
  - 290f948
related_tickets:
  - refactoring-031
files_reviewed:
  - app/server/api/characters/[id].put.ts
  - app/server/api/pokemon/[id].put.ts
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/GroupCombatantCard.vue
  - app/components/encounter/PlayerCombatantCard.vue
  - app/server/api/characters/[id].get.ts
  - app/server/api/pokemon/[id].get.ts
  - app/server/api/characters/index.get.ts
  - app/server/api/characters/index.post.ts
scenarios_to_rerun: []
created_at: 2026-02-19
---

## Review: Healing API Fields + Encounter Card Type Safety

### Commits Reviewed

1. **65d8fa8** — `fix: correct maxHp response and add healing fields to character PUT`
   - Fixed bug: response returned `character.hp` (base stat) instead of `character.maxHp` (calculated max HP)
   - Added 7 healing-related fields to character PUT update handler: `maxHp`, `injuries`, `drainedAp`, `restMinutesToday`, `injuriesHealedToday`, `lastInjuryTime`, `lastRestReset`

2. **3b5ede0** — `feat: add healing fields to Pokemon PUT endpoint`
   - Added 5 healing-related fields to Pokemon PUT update handler: `injuries`, `restMinutesToday`, `injuriesHealedToday`, `lastInjuryTime`, `lastRestReset`
   - Correctly omitted `drainedAp` (not in Pokemon schema)

3. **290f948** — `refactor: replace as any casts with typed computeds in encounter cards`
   - Replaced 6 `as any` template casts across 3 encounter card components with typed `avatarUrl` and `pokemonTypes` computed properties
   - Resolves refactoring-031

### Issues Found

#### HIGH — PUT response shape missing healing fields (pre-existing)

Both PUT endpoints accept healing fields for write but don't return them in the response. The GET endpoints DO return them:

| Field | char GET | char PUT | poke GET | poke PUT |
|-------|----------|----------|----------|----------|
| injuries | yes (L99) | no | yes (L61) | no |
| temporaryHp | yes (L100) | no | yes (L62) | no |
| drainedAp | yes (L106) | no | N/A | N/A |
| lastInjuryTime | yes (L102) | no | yes (L72) | no |
| restMinutesToday | yes (L103) | no | yes (L73) | no |
| injuriesHealedToday | yes (L104) | no | yes (L74) | no |
| lastRestReset | yes (L105) | no | yes (L75) | no |

**Impact:** A client that writes healing data and uses the PUT response to sync local state will silently lose healing fields.

**Action:** Filed as refactoring-040 (not blocking this work — pre-existing gap, not introduced by these commits).

### What Looks Good

1. **maxHp fix is correct and complete.** Grep confirmed no other endpoints had the `character.hp` → `maxHp` mistake.
2. **Pokemon drainedAp correctly omitted.** Worker checked the Prisma schema and only added fields that exist on the Pokemon model.
3. **Date handling is correct.** `body.X ? new Date(body.X) : null` properly converts ISO strings and handles explicit null-reset.
4. **Refactoring is clean and consistent.** All 3 encounter card components have identical `avatarUrl`/`pokemonTypes` computed implementations using the existing `isPokemon` discriminator.
5. **Ticket hygiene.** refactoring-031 Resolution Log filled with commit hash and approach.

### Verdict

**APPROVED** — All three commits are correct, well-scoped, and follow project patterns. The PUT response shape gap is pre-existing and tracked separately.
