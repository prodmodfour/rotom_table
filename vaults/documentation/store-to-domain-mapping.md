# Store-to-Domain Mapping

Maps [[pinia-store-classification|Pinia stores]] to their domains and [[api-endpoint-layout|API groups]].

| Store | Domain | API group |
|---|---|---|
| `encounter` | Active encounter | `encounters` (combat actions) |
| `encounterCombat` | Status / stages | `encounters` (status, stages) |
| `encounterXp` | XP calculation / distribution | `encounters` (xp-calculate, xp-distribute, trainer-xp-distribute) |
| `encounterGrid` | VTT grid | `encounters` (position, grid-config, background) |
| `encounterLibrary` | Templates | `encounter-templates` |
| `encounterTables` | Encounter tables | `encounter-tables` |
| `library` | [[library-store|Characters + Pokemon]] | `characters`, `pokemon` |
| `groupView` | Group TV display | `group` (map, wild-spawn) |
| `groupViewTabs` | Tab routing + scenes | `group` (tab), `scenes` |
| `fogOfWar` | Fog of war grid | `encounters` (fog) |
| `terrain` | Terrain grid | `encounters` (terrain) |
| `measurement` | Range measurement | client-only |
| `selection` | Grid selection | client-only |
| `settings` | User preferences | localStorage only |
