## Tier 5: Scene Workflow

### R002 — Habitat Pokemon Assignment

- **Rule:** "Pokemon assigned to habitats. GM can deviate."
- **Expected behavior:** Scene habitat link enables Pokemon generation from linked table.
- **Actual behavior:** `SceneHabitatPanel` (C034) links scene to encounter table via `habitatId`. Encounter table entries define Pokemon species. Wild spawn generation uses the linked table to determine available species. The link is a foreign key reference, not a hardcoded habitat-species mapping — this is more flexible than PTU's fixed list, allowing GM customization as PTU suggests.
- **Classification:** Correct

### R035 — Movement Capabilities

- **Rule:** "Overland, Swim, Sky, Levitate, Burrow, Teleporter — each defines meters of shift per turn."
- **Expected behavior:** VTT grid handles movement capabilities during encounters.
- **Actual behavior:** `app/utils/combatantCapabilities.ts` provides `combatantCanFly`, `combatantCanSwim`, `combatantCanBurrow`, `getSkySpeed`. `useGridMovement.ts:59-76` selects terrain-aware speed based on capabilities (Swim for water, Burrow for earth, Overland default). Overland, Swim, Sky, and Burrow are all functional. Levitate is handled via the elevation system (`useElevation.ts`). Teleporter is not implemented (Out of Scope in vtt-grid).
- **Classification:** Correct

---
