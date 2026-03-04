---
review_id: code-review-297
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-005
domain: combat
commits_reviewed:
  - 8eaea9de
  - 34df0387
  - 74beac95
  - 3df22372
  - 9a95d52c
  - 834f3a18
  - 360b71bc
  - 502cf645
  - de7732c0
  - 0ec66cf1
  - 6115647c
  - 21a90b58
  - 240a3448
  - 1da17253
  - 87c2a6b1
files_reviewed:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/types/api.ts
  - app/constants/livingWeapon.ts
  - app/utils/combatantCapabilities.ts
  - app/server/services/living-weapon.service.ts
  - app/server/services/living-weapon-state.ts
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/living-weapon/engage.post.ts
  - app/server/api/encounters/[id]/living-weapon/disengage.post.ts
  - app/server/api/encounters/[id]/combatants/[combatantId].delete.ts
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/routes/ws.ts
  - app/stores/encounter.ts
  - app/composables/useWebSocket.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 3
reviewed_at: 2026-03-03T08:15:00Z
follows_up: null
---

## Review Scope

P0 implementation of the Living Weapon system (feature-005), covering Sections A-D of design-living-weapon-001:
- A: WieldRelationship data model and combatant wield state fields
- B: Living Weapon constants and capability parsing
- C: Engage/disengage API endpoints
- D: Wield state tracking, WebSocket events, auto-disengage on removal/recall/switch

15 commits reviewed (8eaea9de through 87c2a6b1). 18 files changed, ~972 insertions.

Decree check: No applicable decrees for the Living Weapon domain. decree-033 (fainted switch timing), decree-034 (Roar recall range), decree-038 (decouple condition behaviors), decree-039 (Roar vs Trapped), and decree-040 (flanking after evasion cap) are combat domain but not relevant to wield state mechanics. decree-001 (minimum 1 damage), decree-005 (auto-apply CS from status), and decree-012 (type-based status immunities) do not interact with P0 wield state. No decree violations found.

## Issues

### CRITICAL

**C1: `encounter_update` WebSocket broadcast sends malformed data that will crash group/player clients**

Files: `app/server/api/encounters/[id]/living-weapon/engage.post.ts` (lines 82-85), `app/server/api/encounters/[id]/living-weapon/disengage.post.ts` (lines 81-84)

Both endpoints broadcast:
```typescript
broadcastToEncounter(id, {
  type: 'encounter_update',
  data: { encounterId: id }
})
```

The client-side `updateFromWebSocket(data: Encounter)` in `app/stores/encounter.ts` (line 863) iterates `data.combatants` with a `for..of` loop. When `data` is `{ encounterId: id }`, `data.combatants` is `undefined`, causing a `TypeError: undefined is not iterable` that crashes the store update for all group and player WebSocket clients.

The correct pattern is to either:
1. Send the full encounter response as the broadcast data: `data: response` (where `response = buildEncounterResponse(record, finalCombatants)`)
2. Or remove the `encounter_update` broadcast entirely and rely only on the specific `living_weapon_engage`/`living_weapon_disengage` events (which would require adding client-side handlers for those events in `useWebSocket.ts`).

Note: This same malformed broadcast pattern exists in mount.post.ts and dismount.post.ts (pre-existing bug), but copying a broken pattern does not excuse the new instance. The Living Weapon endpoints must fix this regardless.

**Impact**: Every engage/disengage action crashes WebSocket state sync for all non-GM clients. This makes the feature unusable in multi-view setups (GM + Group TV + Player views).

### HIGH

**H1: `living_weapon_engage` and `living_weapon_disengage` WebSocket events have no client-side handler**

Files: `app/composables/useWebSocket.ts`, `app/types/api.ts`

The engage/disengage endpoints broadcast `living_weapon_engage` and `living_weapon_disengage` events. The WS relay in `ws.ts` (lines 543-555) correctly forwards these events. However:

1. `useWebSocket.ts` `handleMessage()` has no `case` for either event type -- they are silently dropped.
2. `app/types/api.ts` `WebSocketEvent` union type does not include these two event types, so they cannot be typed correctly even if handlers were added.

If the `encounter_update` broadcast is fixed (C1), these specific events become informational (the full state sync carries the updated data). But they should still be added to the `WebSocketEvent` type for type safety, and the client-side handler should at minimum have a no-op case to indicate intentional handling via the companion `encounter_update`.

**H2: Stale `wielder` combatant in engage endpoint response**

File: `app/server/api/encounters/[id]/living-weapon/engage.post.ts` (lines 94-95)

The response returns `result.wielder` and `result.weapon` from the service call, but after the service returns, the endpoint applies `standardActionUsed: true` to the combatants (lines 56-67), producing `finalCombatants`. The `result.wielder` object does NOT reflect the Standard Action consumption. Any client code that uses the `wielder` field from the response will see `turnState.standardActionUsed === false`, contradicting the actual persisted state.

Fix: Extract the updated wielder and weapon from `finalCombatants` instead:
```typescript
const finalWielder = finalCombatants.find(c => c.id === body.wielderId)!
const finalWeapon = finalCombatants.find(c => c.id === body.weaponId)!
```

Similarly, the disengage endpoint (lines 54-65) applies `swiftActionUsed: true` after the service call but returns the pre-update `result.wielder` and `result.weapon`. Same fix needed.

**H3: No unit tests for any Living Weapon code**

Per Senior Reviewer Lesson 1: Verify test coverage for behavioral changes.

Zero test files exist for:
- `living-weapon.service.ts` (351 lines of validation and state mutation logic)
- `living-weapon-state.ts` (51 lines of reconstruction logic)
- `combatantCapabilities.ts` `getLivingWeaponConfig()` function
- `livingWeapon.ts` constants (data correctness vs PTU rules)

The service contains significant validation logic (8 validation rules in `engageLivingWeapon`, skill rank checking, adjacency checking, same-side checking) and immutable state transformations. These are pure functions -- they are the easiest code in the project to unit test.

File a ticket for test coverage. This is blocking because the validation logic has edge cases that are only verifiable through tests (e.g., what happens when `pokemon.capabilities` is null? what if `skills.Combat` is a non-standard value?).

### MEDIUM

**M1: Unsafe type cast for homebrew species in `weaponSpecies`**

Files: `app/server/services/living-weapon.service.ts` (line 211), `app/server/services/living-weapon-state.ts` (lines 35-37)

In `engageLivingWeapon`:
```typescript
const weaponSpecies = weaponConfig.species as WieldRelationship['weaponSpecies']
```

`WieldRelationship['weaponSpecies']` is typed as `'Honedge' | 'Doublade' | 'Aegislash'`. But `getLivingWeaponConfig()` returns a config with `species: pokemon.species` for homebrew Pokemon (line 239 of `combatantCapabilities.ts`). A homebrew Pokemon named "Swordbert" would produce `weaponSpecies: 'Swordbert'` cast to the union type, violating the type contract silently.

The reconstruction in `living-weapon-state.ts` handles this more carefully (line 36: defaults unknown species to `'Honedge'`), but the service does not.

Fix: Either widen the `weaponSpecies` type to `string` (with the three known species as documentation), or add the same defaulting logic as the reconstruction:
```typescript
const weaponSpecies = (LIVING_WEAPON_CONFIG[weaponConfig.species]
  ? weaponConfig.species
  : 'Honedge') as WieldRelationship['weaponSpecies']
```

**M2: `app-surface.md` not updated with new endpoints, services, and constants**

File: `.claude/skills/references/app-surface.md`

Per the review checklist: "If new endpoints/components/routes/stores: was app-surface.md updated?"

The following are missing from app-surface.md:
- New endpoints: `POST /api/encounters/:id/living-weapon/engage`, `POST /api/encounters/:id/living-weapon/disengage`
- New service files: `living-weapon.service.ts`, `living-weapon-state.ts`
- New constants file: `livingWeapon.ts`
- New utility function: `getLivingWeaponConfig()` in `combatantCapabilities.ts`
- New WebSocket event types: `living_weapon_engage`, `living_weapon_disengage`

**M3: Engage endpoint does not validate Standard Action availability before consuming it**

File: `app/server/api/encounters/[id]/living-weapon/engage.post.ts`

The spec (Section C) states: "Marks the trainer's Standard Action as used for this turn." The endpoint unconditionally sets `standardActionUsed: true` (line 62) but does not check whether the trainer's Standard Action is already used. If the trainer already used their Standard Action (e.g., to attack), calling engage should fail with an error, not silently overwrite the flag.

Similarly, the disengage endpoint does not check whether the Swift Action is already used before consuming it.

Compare with the switch endpoint which explicitly validates action availability before marking it used.

## What Looks Good

1. **Clean architecture**: The service layer is properly separated from the API layer. `living-weapon.service.ts` contains pure functions with no DB access. API endpoints handle persistence and WebSocket broadcasting. This follows the established project patterns exactly.

2. **Immutable state transformations**: All service functions return new objects rather than mutating inputs. The `{ ...c, wieldingWeaponId: weaponId }` spread pattern and the `const { wieldingWeaponId, ...rest } = c` destructuring for removal are correct and consistent.

3. **Comprehensive auto-disengage coverage**: The developer identified and handled all three combatant removal paths (direct delete, recall, switch). The L2 lesson about duplicate code paths was explicitly followed, as documented in the implementation log.

4. **Correct PTU rule implementation**: Weapon move data (Wounding Strike, Double Swipe, Bleed!) matches PTU pp.288-290. Species configurations (Honedge=Simple/mainHand, Doublade=Simple/mainHand+offHand+dualWield, Aegislash=Fine/mainHand+offHand+shield) match PTU pp.305-306. Skill rank requirements (Simple=Novice, Fine=Adept) are correct.

5. **Encounter-scoped design**: The decision to store wield state in combatant flags (persisted via JSON column) and reconstruct `wieldRelationships[]` at runtime avoids a Prisma migration. The `reconstructWieldRelationships()` function is clean and handles edge cases (unknown species, fainted state from entity HP).

6. **Good commit granularity**: 15 commits with clear, focused changes. Each commit is a logical unit (types, constants, parser, service, each endpoint, each integration point). This matches the project's commit guidelines well.

7. **WebSocket relay handlers**: The ws.ts additions for `living_weapon_engage` and `living_weapon_disengage` follow the exact same pattern as other combat events (mount_change, status_tick, etc.).

8. **Store getters**: The five new getters in the encounter store (isWieldingWeapon, isBeingWielded, getWieldedWeapon, getWeaponWielder, wieldPairs) use the combatant flags for O(1) lookup rather than scanning wieldRelationships. This is efficient and follows the spec's denormalization rationale.

9. **Faint behavior**: The damage.post.ts comment correctly explains that fainted Living Weapons remain wielded (PTU p.305) and that the isFainted flag is derived from entity HP during reconstruction, requiring no explicit update.

## Verdict

**CHANGES_REQUIRED**

C1 is a showstopper: the malformed `encounter_update` broadcast will crash all non-GM WebSocket clients on every engage/disengage action. H2 returns stale data in the API response. M3 allows consuming actions that were already used. These must be fixed before P0 can be considered complete.

## Required Changes

1. **[C1] Fix `encounter_update` broadcast data** in both engage.post.ts and disengage.post.ts. Send the full encounter response object instead of `{ encounterId: id }`. Example: `data: response` where `response` is the already-computed `buildEncounterResponse(record, finalCombatants)`.

2. **[H1] Add `living_weapon_engage` and `living_weapon_disengage` to the `WebSocketEvent` union type** in `app/types/api.ts`. Add no-op cases in `useWebSocket.ts` `handleMessage()` with a comment explaining state sync happens via the companion `encounter_update`.

3. **[H2] Return updated wielder/weapon from `finalCombatants`** in both engage.post.ts and disengage.post.ts, not the stale `result.wielder`/`result.weapon`.

4. **[H3] File a ticket** for unit test coverage of `living-weapon.service.ts`, `living-weapon-state.ts`, and `getLivingWeaponConfig()`. Minimum coverage: engage validation rules, disengage state clearing, reconstruction from flags, homebrew species fallback, skill rank validation.

5. **[M1] Add species validation** in `engageLivingWeapon` to default unknown species to `'Honedge'` (matching the reconstruction logic), rather than unsafely casting.

6. **[M2] Update `app-surface.md`** with new endpoints, services, constants, utility function, and WebSocket event types.

7. **[M3] Add Standard Action availability check** in engage.post.ts before marking `standardActionUsed: true`. Add Swift Action availability check in disengage.post.ts before marking `swiftActionUsed: true`. Return 400 if the action is already consumed.
