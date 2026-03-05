---
domain: character-lifecycle
type: browser-audit-untestable
untestable_count: 52
---

# Browser Audit: Untestable Items - character-lifecycle

Items classified as Untestable have no direct UI terminus -- they are server-side services, API endpoints, Prisma models, store internals, type definitions, or WebSocket events. Their correctness was verified by the Implementation Auditor through code review, not browser inspection.

## Prisma Models (1)

| Capability ID | Name | Location | Reason |
|---------------|------|----------|--------|
| C001 | HumanCharacter Model | `app/prisma/schema.prisma` | Database schema definition; no UI element |

## API Endpoints (17)

| Capability ID | Name | Location | Reason |
|---------------|------|----------|--------|
| C002 | List Characters | `app/server/api/characters/index.get.ts` | Server-side data fetch; UI terminus is C089 (GM Sheets Page) |
| C003 | Create Character | `app/server/api/characters/index.post.ts` | Server-side handler; UI terminus is C090 (GM Create Page) |
| C004 | Get Character | `app/server/api/characters/[id].get.ts` | Server-side handler; UI terminus is C091 (GM Character Detail) |
| C005 | Update Character | `app/server/api/characters/[id].put.ts` | Server-side handler; UI terminus is C091 edit mode |
| C006 | Delete Character | `app/server/api/characters/[id].delete.ts` | Server-side handler; no dedicated delete UI observed |
| C007 | List Player Characters | `app/server/api/characters/players.get.ts` | Server-side handler; UI terminus is group lobby + player picker |
| C008 | Import Character from CSV | `app/server/api/characters/import-csv.post.ts` | Server-side handler; no visible UI import trigger found (see view-gm.md Absent item) |
| C009 | Player View | `app/server/api/characters/[id]/player-view.get.ts` | Server-side handler; UI terminus is C084 (Player Character Sheet) |
| C010 | Get Equipment | `app/server/api/characters/[id]/equipment.get.ts` | Server-side handler; UI terminus is C064 (Equipment Tab) |
| C011 | Update Equipment | `app/server/api/characters/[id]/equipment.put.ts` | Server-side handler; UI terminus is C064 (Equipment Tab) |
| C012 | Rest Healing | `app/server/api/characters/[id]/rest.post.ts` | Server-side handler; UI terminus is healing tab/panel |
| C013 | Extended Rest | `app/server/api/characters/[id]/extended-rest.post.ts` | Server-side handler; UI terminus is healing tab/panel |
| C014 | Pokemon Center Healing | `app/server/api/characters/[id]/pokemon-center.post.ts` | Server-side handler; UI terminus is healing tab/panel |
| C015 | New Day Reset | `app/server/api/characters/[id]/new-day.post.ts` | Server-side handler; UI terminus is "Advance Day" button in GM header |
| C016 | Heal Injury | `app/server/api/characters/[id]/heal-injury.post.ts` | Server-side handler; UI terminus is healing tab |
| C017 | Award Trainer XP | `app/server/api/characters/[id]/xp.post.ts` | Server-side handler; UI terminus is C056 (TrainerXpPanel) |
| C018 | Get XP History | `app/server/api/characters/[id]/xp-history.get.ts` | Server-side handler; UI terminus is C056 (TrainerXpPanel) |

## Services (10)

| Capability ID | Name | Location | Reason |
|---------------|------|----------|--------|
| C019 | Build Human Entity from Record | `app/server/services/entity-builder.service.ts` | Internal data transformation |
| C020 | Build Pokemon Entity from Record | `app/server/services/entity-builder.service.ts` | Internal data transformation |
| C021 | Sync Entity to Database | `app/server/services/entity-update.service.ts` | Internal persistence operation |
| C022 | Sync Damage to Database | `app/server/services/entity-update.service.ts` | Internal persistence operation |
| C023 | Sync Healing to Database | `app/server/services/entity-update.service.ts` | Internal persistence operation |
| C024 | Sync Status to Database | `app/server/services/entity-update.service.ts` | Internal persistence operation |
| C025 | Sync Stages to Database | `app/server/services/entity-update.service.ts` | Internal persistence operation |
| C026 | Detect CSV Sheet Type | `app/server/services/csv-import.service.ts` | Internal parsing utility |
| C027 | Parse Trainer Sheet | `app/server/services/csv-import.service.ts` | Internal parsing utility |
| C028 | Create Trainer from CSV | `app/server/services/csv-import.service.ts` | Internal persistence operation |

## Composables / Utilities (5)

| Capability ID | Name | Location | Reason |
|---------------|------|----------|--------|
| C029 | Character Creation Composable | `app/composables/useCharacterCreation.ts` | Composable function; UI terminus is C090 (Create Page) |
| C031 | Validate Stat Allocation | `app/utils/characterCreationValidation.ts` | Pure validation utility; output surfaced via composable |
| C032 | Validate Skill Background | `app/utils/characterCreationValidation.ts` | Pure validation utility; output surfaced via composable |
| C033 | Validate Edges and Features | `app/utils/characterCreationValidation.ts` | Pure validation utility; output surfaced via composable |
| C030 | Character Export/Import Composable | `app/composables/useCharacterExportImport.ts` | Composable function; UI terminus checked in view-player.md |

## Store Actions & Getters (19)

| Capability ID | Name | Location | Reason |
|---------------|------|----------|--------|
| C034 | Load Library | `app/stores/library.ts` | Store action; UI terminus is C089 (Sheets Page) |
| C035 | Create Human (Store) | `app/stores/library.ts` | Store action; UI terminus is C090 (Create Page) |
| C036 | Update Human (Store) | `app/stores/library.ts` | Store action; UI terminus is C091 (Detail Page) |
| C037 | Delete Human (Store) | `app/stores/library.ts` | Store action; UI terminus is delete button on detail page |
| C038 | Link Pokemon to Trainer | `app/stores/library.ts` | Store action; no dedicated UI observed |
| C039 | Unlink Pokemon | `app/stores/library.ts` | Store action; no dedicated UI observed |
| C040 | Filtered Humans (Getter) | `app/stores/library.ts` | Store getter; UI terminus checked in view-gm.md |
| C041 | Filtered Players (Getter) | `app/stores/library.ts` | Store getter; internal state filter |
| C042 | Grouped NPCs by Location (Getter) | `app/stores/library.ts` | Store getter; UI would appear on sheets page with NPC data |
| C043 | Get Human by ID (Getter) | `app/stores/library.ts` | Store getter; internal lookup |
| C044 | Get Pokemon by Owner (Getter) | `app/stores/library.ts` | Store getter; internal lookup |
| C045 | Set Library Filters | `app/stores/library.ts` | Store action; UI terminus checked in view-gm.md |
| C046 | Set Player Identity | `app/stores/playerIdentity.ts` | Store action; UI terminus is C085 (PlayerIdentityPicker) |
| C047 | Set Character Data (Player) | `app/stores/playerIdentity.ts` | Store action; UI terminus is C084 (Player Sheet) |
| C048 | Clear Player Identity | `app/stores/playerIdentity.ts` | Store action; UI terminus is "Switch character" button |
| C049 | Is Identified (Getter) | `app/stores/playerIdentity.ts` | Store getter; gates C085 vs C084 display |
| C050 | Distribute Trainer XP (Store) | `app/stores/encounterXp.ts` | Store action; no character-lifecycle-specific UI |
| C051 | Scene Character Added (Group) | `app/stores/groupViewTabs.ts` | Store action; checked in view-group.md |
| C052 | Scene Character Removed (Group) | `app/stores/groupViewTabs.ts` | Store action; checked in view-group.md |

## Types (1)

| Capability ID | Name | Location | Reason |
|---------------|------|----------|--------|
| C087 | Character Type Definitions | `app/types/character.ts` | TypeScript type definitions; no runtime UI |

## WebSocket Events (1)

| Capability ID | Name | Location | Reason |
|---------------|------|----------|--------|
| C088 | Character Update Broadcast | `app/server/api/characters/[id]/xp.post.ts` | Server-side WebSocket emission; receiver behavior not directly testable via accessibility tree |

---

## Summary

52 capabilities are classified as Untestable because they have no direct browser-accessible element. Their correctness is assured through code review (Implementation Auditor) and unit tests (Vitest), not browser inspection.
