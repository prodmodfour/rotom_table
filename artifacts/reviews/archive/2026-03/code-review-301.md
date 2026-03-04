---
review_id: code-review-301
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-005
domain: combat
commits_reviewed:
  - 07b9fedd
  - c234ea7f
  - 11f9dfa9
  - afe70f52
  - 22cdf4c7
  - b95b15df
  - 4d6e59ce
  - 63b0f9b7
files_reviewed:
  - app/server/api/encounters/[id]/living-weapon/engage.post.ts
  - app/server/api/encounters/[id]/living-weapon/disengage.post.ts
  - app/server/services/living-weapon.service.ts
  - app/server/services/living-weapon-state.ts
  - app/utils/combatantCapabilities.ts
  - app/constants/livingWeapon.ts
  - app/types/api.ts
  - app/composables/useWebSocket.ts
  - app/server/routes/ws.ts
  - app/server/api/encounters/[id]/mount.post.ts
  - app/server/api/encounters/[id]/dismount.post.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/feature/feature-024.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-03T14:45:00Z
follows_up: code-review-297
---

## Review Scope

Re-review of feature-005 P0 fix cycle (8 commits, 07b9fedd through 63b0f9b7). Verifying that all issues from code-review-297 (1 CRITICAL, 3 HIGH, 3 MEDIUM) and rules-review-270 (2 HIGH, 1 MEDIUM) have been addressed.

Decree check: decree-043 (Combat Skill Rank gates weapon move access, not engagement) is the primary applicable decree. Implementation now explicitly cites decree-043 in comments and correctly removes the engagement rank gate. decree-033 (fainted switch timing) and decree-038 (sleep persists through recall) are combat domain but not affected by this fix cycle. No decree violations found.

## Verification of code-review-297 Issues

### C1: Malformed `encounter_update` WS broadcast -- FIXED

**Commit:** 22cdf4c7, 11f9dfa9, afe70f52

Both engage.post.ts (line 133-136) and disengage.post.ts (line 121-124) now broadcast the full `buildEncounterResponse(record, finalCombatants)` object as the `encounter_update` data, not the bare `{ encounterId: id }` that would crash `updateFromWebSocket()`.

Additionally, 22cdf4c7 fixed the same pre-existing bug in mount.post.ts and dismount.post.ts. Both now send `data: response` where `response = buildEncounterResponse(record, ...)`. Verified by reading both files -- mount.post.ts line 59 and dismount.post.ts line 66 both pass the full response. This is a commendable beyond-scope fix.

### H1: Missing WS event types and handlers -- FIXED

**Commit:** b95b15df

`app/types/api.ts` lines 52-54 now include both event types in the `WebSocketEvent` discriminated union:
```typescript
| { type: 'living_weapon_engage'; data: { encounterId: string; wieldRelationship: WieldRelationship } }
| { type: 'living_weapon_disengage'; data: { encounterId: string; wielderId: string; weaponId: string } }
```

`app/composables/useWebSocket.ts` lines 239-244 add a combined no-op case with a clear comment explaining state sync happens via the companion `encounter_update` broadcast. This matches the existing `mount_change` handler pattern (lines 233-237). The `WieldRelationship` import was added to `api.ts` from `combat.ts`.

### H2: Stale wielder/weapon in response -- FIXED

**Commits:** 11f9dfa9, afe70f52

Engage endpoint (lines 120-121) now extracts `updatedWielder` and `updatedWeapon` from `finalCombatants` (which includes the `standardActionUsed: true` flag), not from the stale `result.wielder`/`result.weapon`. Disengage endpoint (lines 107-108) does the same with `swiftActionUsed: true`. Both have explanatory comments citing the H2 fix.

### H3: No unit tests -- TICKET FILED

**Commit:** 63b0f9b7

`artifacts/tickets/open/feature/feature-024.md` is well-structured. It lists specific test targets: engage validation, disengage state clearing, reconstruction from flags, homebrew species fallback, and `meetsSkillRequirement` (retained for future P1 use). Priority P3 is appropriate since these are pure functions with no urgent regression risk. The ticket correctly notes these are ideal Vitest candidates due to zero DB dependency.

### M1: Unsafe homebrew species cast -- FIXED

**Commit:** c234ea7f

`living-weapon.service.ts` lines 204-209 now validates against a known species array before casting:
```typescript
const knownSpecies: WieldRelationship['weaponSpecies'][] = ['Honedge', 'Doublade', 'Aegislash']
const weaponSpecies: WieldRelationship['weaponSpecies'] = knownSpecies.includes(
  weaponConfig.species as WieldRelationship['weaponSpecies']
)
  ? (weaponConfig.species as WieldRelationship['weaponSpecies'])
  : 'Honedge'
```

This matches the reconstruction logic in `living-weapon-state.ts` line 35-37, which also defaults unknown species to `'Honedge'`. The two code paths are now consistent.

Additionally, `getLivingWeaponConfig()` in `combatantCapabilities.ts` (lines 400-423) already returns `null` for Pokemon without the Living Weapon capability, and returns a config with `species: pokemon.species` for homebrew species detected via `otherCapabilities`. A homebrew species like "Swordbert" would get `LIVING_WEAPON_CONFIG['Honedge']` with `species: 'Swordbert'`, and the service now correctly maps it back to `'Honedge'` for the relationship type. No 500 error possible.

### M2: Duplicate WS broadcast -- VERIFIED NOT PRESENT

The service layer (`living-weapon.service.ts`) has zero `broadcastToEncounter` calls. All broadcasts originate only from the API endpoints. Engage has exactly two broadcasts: `living_weapon_engage` (specific event) + `encounter_update` (full state sync). Disengage follows the same pattern. This is consistent with mount.post.ts and dismount.post.ts.

### M3: app-surface.md not updated -- FIXED

**Commit:** 4d6e59ce

Verified the following entries now exist in `.claude/skills/references/app-surface.md`:
- Endpoint entries for `POST /api/encounters/:id/living-weapon/engage` and `/disengage` (lines 165-166) with full parameter and validation descriptions
- Service entries for `living-weapon.service.ts` and `living-weapon-state.ts` (lines 310-311) with function inventories

## Verification of rules-review-270 Issues

### HIGH #1: Combat Skill Rank gate blocks engagement -- FIXED

**Commit:** 07b9fedd

Per decree-043, the rank check was removed from `engageLivingWeapon()`. The diff confirms the entire block (lines 188-198 of the old code) -- including the `requiredRank` variable, the `meetsSkillRequirement()` call, and the 400 error -- was deleted. The validation rule count was renumbered from 8 to 7. A clear comment at the function docstring (lines 137-139) cites decree-043 and explains that rank gating is deferred to P1 move injection.

The `meetsSkillRequirement` function is retained in the service (lines 29-35) for future P1 use. The feature-024 test ticket includes it as a test target. This is the correct approach -- keeping the utility available without using it for engagement gating.

### HIGH #2: Engage always charges wielder's Standard Action -- FIXED

**Commit:** 11f9dfa9

The engage endpoint now accepts `initiatorId` in the request body (line 39). The `initiatorId` is validated to be either `wielderId` or `weaponId` (lines 41-46). The Standard Action is consumed on the initiator, not always the wielder (lines 100-111). The default is `body.wielderId` for backwards compatibility (line 39).

PTU p.306: "Re-engaging is a Standard Action that may be taken by either party." The implementation now correctly allows the Pokemon to initiate engagement on its turn, consuming the Pokemon's Standard Action.

The disengage endpoint already handled this correctly in the original implementation (the `combatantId` parameter could be either party). No change needed for disengage.

### MEDIUM #1: No turn validation -- FIXED

**Commits:** 11f9dfa9, afe70f52

Both endpoints now include turn validation following the `use-item.post.ts` pattern:
- Engage: lines 60-78 parse `turnOrder`, find `currentTurnId`, check `isInitiatorsTurn || hasHeldAction`
- Disengage: lines 48-66 do the same for `body.combatantId`

The `holdAction?.isHolding` pattern matches exactly with use-item.post.ts line 81. Error messages are descriptive and mention the held action escape hatch.

Both endpoints also validate action availability (engage: `standardActionUsed` check at line 81-86; disengage: `swiftActionUsed` check at line 69-74). This addresses code-review-297 M3 simultaneously.

## What Looks Good

1. **Thorough fix cycle.** All 7 issues from code-review-297 and all 3 issues from rules-review-270 have been addressed. The fixes are targeted and minimal -- no unnecessary refactoring or scope creep.

2. **Correct commit granularity.** 8 commits, each with a focused purpose. The decree fix (07b9fedd) is separate from the homebrew validation (c234ea7f), which is separate from the endpoint overhauls (11f9dfa9, afe70f52). This is ideal for bisection and rollback.

3. **Beyond-scope fix for mount/dismount.** Commit 22cdf4c7 fixed the same malformed broadcast bug in mount.post.ts and dismount.post.ts. The original review noted this was a pre-existing bug; the developer fixed it proactively. Both endpoints now send the full `buildEncounterResponse` result.

4. **Consistent patterns.** Turn validation follows the `use-item.post.ts` pattern exactly. WebSocket handlers follow the `mount_change` no-op pattern. Homebrew species defaulting is consistent between the service (engage) and the state reconstruction module.

5. **Immutability preserved.** All combatant updates continue to use spread operators. The `finalCombatants` mapping in both endpoints creates new objects rather than mutating `result.combatants`. The endpoint-level `standardActionUsed`/`swiftActionUsed` application is cleanly separated from the service-level flag mutations.

6. **Well-documented intent.** Decree-043 is cited in the service code. PTU page references are maintained in endpoint docstrings. Fix comments reference the original review issue IDs (e.g., "C1 fix: send full response").

7. **File sizes comfortable.** engage.post.ts (155 lines), disengage.post.ts (143 lines), living-weapon.service.ts (349 lines), living-weapon-state.ts (51 lines) -- all well within the 800-line limit.

## Verdict

**APPROVED**

All CRITICAL, HIGH, and MEDIUM issues from code-review-297 and rules-review-270 have been verified as fixed. The implementation correctly follows decree-043 (rank gates moves, not engagement), implements either-party action economy for engage, adds turn and action availability validation, fixes the WebSocket broadcast crash, eliminates stale response data, handles homebrew species safely, updates app-surface.md, and files a test ticket. The mount/dismount broadcast fix was a bonus. No new issues discovered.
