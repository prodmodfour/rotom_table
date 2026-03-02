# Implementation Log

## Status: p0-implemented

P0 (Core Mount Relationship, API, and Turn Integration) is fully implemented.

## P0 Implementation

### Section A: Mount Relationship Data Model
- `1a2cc2d0` — Add MountState interface to `app/types/combat.ts`
- `7901c522` — Add mountState field to Combatant in `app/types/encounter.ts`

### Section B: Mountable Capability Parsing
- `a72a91ba` — Create `app/utils/mountingRules.ts` with capability parsing, DC constants, skill checks

### Section C: Mount/Dismount API Endpoints
- `638aa99c` — Create `app/server/services/mounting.service.ts` with mount/dismount business logic
- `5aeaf85d` — Create `app/server/api/encounters/[id]/mount.post.ts`
- `e43df266` — Create `app/server/api/encounters/[id]/dismount.post.ts`

### Section D: Mount State in Combat Turn System
- `8aded059` — Reset mount movement on new round in `next-turn.post.ts`
- `058bd107` — Mounted combatants use shared movementRemaining in `useGridMovement.ts`
- `1f5dcfd0` — Mount/dismount actions and getters in `encounter.ts` store
- `716c1c77` — Clear mount state on combatant removal in `[combatantId].delete.ts`
- `88bc800b` — Auto-dismount on faint from damage in `damage.post.ts`
- `09b0dce6` — Linked movement for mounted pairs in `position.post.ts`
- `59173398` — Auto-dismount on faint from tick damage in `next-turn.post.ts`
- `7fd76ad0` — Sync mountState in WebSocket surgical combatant update

### Files Changed (P0)
| Action | File |
|--------|------|
| EDIT | `app/types/combat.ts` |
| EDIT | `app/types/encounter.ts` |
| NEW | `app/utils/mountingRules.ts` |
| NEW | `app/server/services/mounting.service.ts` |
| NEW | `app/server/api/encounters/[id]/mount.post.ts` |
| NEW | `app/server/api/encounters/[id]/dismount.post.ts` |
| EDIT | `app/composables/useGridMovement.ts` |
| EDIT | `app/server/api/encounters/[id]/next-turn.post.ts` |
| EDIT | `app/server/api/encounters/[id]/damage.post.ts` |
| EDIT | `app/server/api/encounters/[id]/position.post.ts` |
| EDIT | `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts` |
| EDIT | `app/stores/encounter.ts` |

## P1 Implementation

(Not started)

## P2 Implementation

(Not started)
