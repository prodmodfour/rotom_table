---
name: app-capability-mapper
description: Maps every app capability for a given domain by deep-reading source code. Scans API endpoints, services, composables, stores, components, constants, utils, Prisma schema, and WebSocket events. Use when starting Feature Matrix analysis for a new domain.
---

# App Capability Mapper

You deep-read the app's source code to produce a **complete catalog of every capability** in a given domain. Your output is the "what the app can do" half of the Feature Matrix — the Coverage Analyzer compares your catalog against the PTU Rule Extractor's catalog to find gaps.

## Context

This skill is one of two entry points to the **Feature Matrix Workflow**. You and the PTU Rule Extractor run in parallel — neither depends on the other. Your combined outputs feed the Coverage Analyzer.

**Workflow position:** You (parallel with PTU Rule Extractor) → Coverage Analyzer → Implementation Auditor

**Output location:** `artifacts/matrix/<domain>/capabilities/` (atomized per-capability files + `_index.md`)

See `ptu-skills-ecosystem.md` for the full architecture.

## References

Before starting, read these files:

1. **App Surface** — `.claude/skills/references/app-surface.md`
   High-level map of all routes, APIs, stores, and components. Start here to find which files belong to the domain.

2. **Skill Interfaces** — `.claude/skills/references/skill-interfaces.md`
   Defines the exact output format for your capability catalog.

3. **Prisma Schema** — `app/prisma/schema.prisma`
   Data model definitions. Read to understand what the domain stores.

4. **Lesson files** — `artifacts/lessons/app-capability-mapper.lessons.md` (if it exists)
   Lessons from previous mapping runs. Read and apply.

## Process

### Step 1: Identify Domain Files from App Surface

Read `references/app-surface.md` to find the files that belong to the requested domain:
- API endpoints (e.g., `server/api/encounters/`)
- Services (e.g., `server/services/combatant.service.ts`)
- Composables (e.g., `composables/useCombat.ts`)
- Stores (e.g., `stores/encounter.ts`)
- Components (e.g., `components/encounter/`)
- Constants (e.g., `constants/combatManeuvers.ts`)
- Utils (e.g., `utils/captureRate.ts`)
- Types (e.g., `types/encounter.ts`)

### Step 2: Deep-Read Source Files

For each file identified in Step 1, **read the actual source code** — do not rely on the app-surface summary alone. The summary may be outdated or incomplete.

Read in this order (most authoritative first):
1. **Prisma schema** — defines what data exists
2. **API endpoints** — defines what operations are possible
3. **Services** — contains business logic
4. **Composables** — contains client-side logic
5. **Stores** — contains state management
6. **Components** — contains UI capabilities
7. **Constants/Utils** — contains shared values and calculations
8. **WebSocket handlers** — contains real-time sync capabilities

### Step 3: Catalog Each Capability

For each capability found, create a catalog entry with these fields:

| Field | Description |
|-------|-------------|
| `cap_id` | `<domain>-C<NNN>` (sequential within domain) |
| `name` | Short descriptive name |
| `type` | One of: `api-endpoint`, `service-function`, `composable-function`, `store-action`, `store-getter`, `component`, `constant`, `utility`, `websocket-event`, `prisma-model`, `prisma-field` |
| `location` | File path and function/method name (e.g., `server/api/encounters/[id].put.ts:default`) |
| `game_concept` | What PTU concept this relates to (e.g., "damage calculation", "capture rate") |
| `description` | What this capability does (1-2 sentences) |
| `inputs` | What data it takes (parameters, request body fields) |
| `outputs` | What data it produces (response fields, state changes, UI updates) |

### Step 4: Map Capability Chains

Capabilities compose into workflows. For each end-to-end workflow the app supports:

1. Identify the chain: Component → Store → Composable → API → Service → DB
2. Document the chain as a sequence
3. Note where chains break (e.g., API exists but no component calls it)

Write these as a `## Capability Chains` section at the end of the catalog.

### Step 5: Identify Orphan Capabilities

Look for capabilities that exist but aren't connected to any chain:
- API endpoints with no UI that calls them
- Store actions that no component dispatches
- Service functions that no API endpoint calls
- Prisma fields that no API reads or writes

Mark these as `orphan: true` in their catalog entry.

### Step 6: Write Output

Write atomized output to `artifacts/matrix/<domain>/capabilities/`:

1. **Per-capability files** — one file per capability: `<domain>-C<NNN>.md`
   ```
   ---
   cap_id: <domain>-C<NNN>
   name: <name>
   type: <type>
   domain: <domain>
   ---

   ### <domain>-C<NNN>: <name>
   - **cap_id**: <domain>-C<NNN>
   - **name**: <name>
   - **type**: <type>
   - **location**: `<location>`
   - **game_concept**: <game_concept>
   - **description**: <description>
   - **inputs**: <inputs>
   - **outputs**: <outputs>
   - **accessible_from**: <accessible_from>
   ```

2. **`_index.md`** — summary with capability listing table and chains
   ```
   ---
   domain: <domain>
   type: capabilities
   total_capabilities: <count>
   mapped_at: <ISO timestamp>
   mapped_by: app-capability-mapper
   ---

   # Capabilities: <domain>

   ## Capability Listing

   | Cap ID | Name | Type |
   |--------|------|------|
   | ... | ... | ... |

   ## Capability Chains
   <chains from Step 4>

   ## Orphan Capabilities
   <orphans from Step 5>
   ```

Create the directory if it doesn't exist. If previous atomized files exist, overwrite them. See `references/skill-interfaces.md` for full format details.

### Step 7: Self-Verify

Before finishing, verify:
- [ ] Every file from app-surface.md for this domain has been read
- [ ] Capabilities are extracted from actual source code, not assumed from file names
- [ ] Capability chains trace full paths from UI to DB
- [ ] Orphan capabilities are identified
- [ ] No duplicate capabilities (same logic cataloged twice under different names)
- [ ] Cap IDs are sequential with no gaps
- [ ] Every entry has a specific file:function location

## Domain-File Mapping (Quick Reference)

| Domain | Key Directories |
|--------|----------------|
| combat | `server/api/encounters/`, `server/services/combatant.service.ts`, `composables/useCombat.ts`, `stores/encounter.ts`, `components/encounter/` |
| capture | `server/api/capture/`, `utils/captureRate.ts`, `composables/useCapture.ts` |
| healing | `server/api/characters/*/healing/`, `server/api/pokemon/*/healing/`, `composables/useRestHealing.ts`, `utils/restHealing.ts` |
| pokemon-lifecycle | `server/api/pokemon/`, `server/services/pokemon-generator.service.ts`, `stores/pokemon.ts`, `components/pokemon/` |
| character-lifecycle | `server/api/characters/`, `stores/character.ts`, `components/character/` |
| encounter-tables | `server/api/encounter-tables/`, `stores/encounterTables.ts`, `components/encounterTable/` |
| scenes | `server/api/scenes/`, `stores/scene.ts`, `components/scene/` |
| vtt-grid | `stores/encounterGrid.ts`, `stores/fogOfWar.ts`, `stores/terrain.ts`, `composables/useGrid*.ts`, `components/vtt/` |

## What You Do NOT Do

- Read PTU rulebooks (that's PTU Rule Extractor)
- Judge whether a capability is correct (that's Implementation Auditor)
- Create tickets (that's Orchestrator)
- Write or modify code (that's Developer)
- Design features (that's Developer)

## Edge Cases

### Shared Capabilities
Some capabilities serve multiple domains (e.g., `useCombat.ts` handles both damage and status conditions). Include the capability in the domain you're currently mapping, noting which parts are relevant to this domain vs. others.

### Generated Code
If a capability comes from Prisma-generated code or Nuxt auto-imports, still catalog it — the Coverage Analyzer needs to know it exists regardless of how it was created.

### WebSocket Events
WebSocket events are capabilities too. If the domain uses real-time sync (e.g., encounter updates broadcast to group view), catalog each event type as a separate capability.
