# GM View Routes

All GM routes live under `/gm`. Part of the [[triple-view-system]].

| Route | File | Purpose |
|---|---|---|
| `/gm` | `pages/gm/index.vue` | Encounter management (create, run, control encounters with VTT grid + list) |
| `/gm/sheets` | `pages/gm/sheets.vue` | Character/Pokemon library (browse, filter, search, grouped by location) |
| `/gm/create` | `pages/gm/create.vue` | [[character-creation-page|Create Human Character or Pokemon]] |
| `/gm/characters/:id` | `pages/gm/characters/[id].vue` | Human character sheet (Stats, Classes, Skills, Equipment, Pokemon, Healing, Notes tabs) |
| `/gm/pokemon/:id` | `pages/gm/pokemon/[id].vue` | Pokemon sheet (Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes tabs) |
| `/gm/encounters` | `pages/gm/encounters.vue` | Encounter template library (CRUD templates) |
| `/gm/encounter-tables` | `pages/gm/encounter-tables.vue` | Encounter tables list (create, import/export, generate) |
| `/gm/encounter-tables/:id` | `pages/gm/encounter-tables/[id].vue` | Encounter table editor (entries, sub-habitats, generation) |
| `/gm/habitats` | `pages/gm/habitats/index.vue` | Alternate encounter table list |
| `/gm/habitats/:id` | `pages/gm/habitats/[id].vue` | Alternate encounter table editor |
| `/gm/scenes` | `pages/gm/scenes/index.vue` | Scene manager (list, activate/deactivate) |
| `/gm/scenes/:id` | `pages/gm/scenes/[id].vue` | Scene editor (drag-and-drop canvas, groups, weather, habitats) |
| `/gm/map` | `pages/gm/map.vue` | Region map (display and serve to Group View) |

## Layout components

- **ServerAddressDisplay.vue** — LAN address panel showing server IP and port. Click-outside dismiss, clipboard copy.
- **SessionUrlDisplay.vue** — Combined tunnel + LAN URL panel. Tunnel URL CRUD, LAN address list, clipboard copy with select-to-copy fallback for non-HTTPS, QR code toggle via [[qr-code-utility]].
