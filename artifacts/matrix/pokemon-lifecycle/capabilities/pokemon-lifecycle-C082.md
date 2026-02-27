---
cap_id: pokemon-lifecycle-C082
name: LevelUpNotification
type: component
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C082: LevelUpNotification
- **cap_id**: pokemon-lifecycle-C082
- **name**: Level-Up Notification Panel
- **type**: component
- **location**: `app/components/encounter/LevelUpNotification.vue`
- **game_concept**: Detailed level-up effects display
- **description**: Renders detailed level-up info for Pokemon that gained levels. Per Pokemon: stat points, tutor points, new moves, ability milestones (second at 20, third at 40), evolution eligibility. Uses Phosphor icons. Filters to only leveled-up Pokemon from XpApplicationResult array.
- **inputs**: results: XpApplicationResult[]
- **outputs**: Visual-only
- **accessible_from**: gm

---

## Capability Chains

### Chain 1: Manual Pokemon Creation
1. **GM** -> `library.createPokemon` (C050) -> `POST /api/pokemon` (C036) -> `resolveNickname` (C027) -> `serializePokemon` (C028) -> Pokemon record created -> Store updated
- **Accessible from**: gm

### Chain 2: Generated Pokemon Creation (Wild/Template)
1. **Server** -> `generateAndCreatePokemon` (C031) -> `generatePokemonData` (C029) [SpeciesData lookup, nature via NATURE_TABLE (C013), stat distribution (C033), move selection, ability pick] -> `createPokemonRecord` (C030) -> `resolveNickname` (C027) -> Pokemon record created
2. **For encounter insertion**: -> `buildPokemonCombatant` (C032) -> Combatant in encounter JSON
- **Accessible from**: gm (via encounter spawn endpoints)

### Chain 3: Pokemon Sheet Viewing & Editing
1. **GM** navigates to `/gm/pokemon/:id` (C080) -> `GET /api/pokemon/:id` (C035) -> `serializePokemon` (C028) -> Page rendered with `PokemonEditForm` (C072), tab components (C074-C077)
2. **GM** clicks Edit -> `PokemonLevelUpPanel` (C073) watches level changes -> `POST /api/pokemon/:id/level-up-check` (C043) -> `checkLevelUp` (C018) + `summarizeLevelUps` (C019) -> Panel shows new moves/abilities
3. **GM** saves -> `library.updatePokemon` (C051) -> `PUT /api/pokemon/:id` (C037) -> `serializePokemon` (C028) -> Store + page refreshed
- **Accessible from**: gm

### Chain 4: Trainer-Pokemon Linking
1. **GM** -> `library.linkPokemonToTrainer` (C053) -> `POST /api/pokemon/:id/link` (C039) -> ownerId set -> Store updated
2. **Or via capture**: Capture attempt endpoint auto-links on success (sets ownerId + origin='captured')
- **Accessible from**: gm

### Chain 5: Post-Combat XP Distribution
1. **GM** opens XpDistributionModal (C078) -> `encounter.calculateXp` (C055) -> `POST /api/encounters/:id/xp-calculate` (C044) -> `enrichDefeatedEnemies` (C022) + `calculateEncounterXp` (C020) -> Returns XP preview + participating Pokemon
2. **GM** adjusts significance (C015/C016), allocates XP per Pokemon, previews level-ups via `getLevelForXp` (C024)
3. **GM** clicks Apply -> `encounter.distributeXp` (C056) -> `POST /api/encounters/:id/xp-distribute` (C045) -> For each Pokemon: `calculateLevelUps` (C021) [-> `checkLevelUp` (C018)] -> Updates experience/level/tutorPoints/maxHp -> Marks encounter xpDistributed
4. **Results phase**: `XpDistributionResults` (C081) + `LevelUpNotification` (C082) display outcomes
- **Accessible from**: gm

### Chain 6: Manual XP Grant
1. **GM** -> `POST /api/pokemon/:id/add-experience` (C042) -> `calculateLevelUps` (C021) [-> `checkLevelUp` (C018)] -> Updates experience/level/tutorPoints/maxHp -> Returns XpApplicationResult
- **Accessible from**: gm

### Chain 7: Bulk Archive/Delete
1. **GM** -> `POST /api/pokemon/bulk-action` (C041) -> Safety check (active encounters) -> Archive (isInLibrary=false) or Delete -> Returns count
- **Accessible from**: gm

### Chain 8: Player Export/Import
1. **Player** -> `handleExport` (C070) -> `GET /api/player/export/:characterId` (C047) -> JSON download with character + Pokemon
2. **Player** -> `handleImportFile` (C071) -> `POST /api/player/import/:characterId` (C048) -> Zod validation -> Conflict detection -> Atomic DB update -> Returns update counts + conflicts
- **Accessible from**: player

### Chain 9: Sprite Resolution
1. **Any view** -> `usePokemonSprite().getSpriteUrl()` (C062) -> dex number lookup (C065) -> Gen 1-5: PokeAPI B2W2 GIF / Gen 6+: Showdown GIF
2. **Fallback**: `getSpriteWithFallback()` (C064) -> HEAD-checks multiple sources -> placeholder SVG as last resort
- **Accessible from**: gm, player, group

### Chain 10: Library Browsing & Filtering
1. **GM** -> `library.loadLibrary` (C049) -> Populates store
2. **GM** adjusts filters -> `library.setFilters` (C061) -> `filteredPokemon` getter (C057) applies search/type/origin/sort
3. **GM** clicks Pokemon -> navigates to sheet page (C080)
- **Accessible from**: gm

---

## Accessibility Summary

### GM View (`/gm`)
- **Full CRUD**: Create (C036/C050), Read (C034/C035), Update (C037/C051), Delete (C038/C052)
- **Linking**: Link/Unlink (C039-C040/C053-C054)
- **Bulk ops**: Archive/Delete (C041)
- **XP system**: Calculate (C044/C055), Distribute (C045/C056), Manual grant (C042)
- **Level-up**: Preview (C043/C073)
- **Sheet**: Full interactive sheet (C080) with tabs (C072-C077), dice rolling (C066-C069)
- **Library**: Filter, sort, browse (C049/C057-C061)
- **Sprites**: Full resolution (C062-C065)

### Group View (`/group`)
- **Read-only**: Pokemon data visible in encounter display (combatant entities)
- **Sprites**: Display sprites (C062-C065)
- **WebSocket**: Receives character_update events (C079)

### Player View (`/player`)
- **Read**: View own Pokemon on character sheet
- **Export/Import**: Download/upload character + Pokemon JSON (C047-C048/C070-C071)
- **Sprites**: Display sprites (C062-C065)
- **WebSocket**: Receives character_update events (C079)

### API-Only (No UI)
- **Services**: generatePokemonData (C029), createPokemonRecord (C030), generateAndCreatePokemon (C031), buildPokemonCombatant (C032), distributeStatPoints (C033)
- **Utilities**: applyNatureToBaseStats (C017), checkLevelUp (C018), summarizeLevelUps (C019), enrichDefeatedEnemies (C022), resolveNickname (C027), serializePokemon (C028)
- **Constants**: NATURE_TABLE (C013)
- **Models**: SpeciesData (C002)

---

## Missing Subsystems

1. **Evolution System**: No automated evolution detection or species transformation. Level-up check notes "check Pokedex entry" as a reminder but cannot detect evolution conditions (level, item, trade, etc.) because SpeciesData doesn't encode evolution triggers. GM must manually handle evolution.

2. **Stat Point Allocation UI**: Level-ups report stat points gained but there is no UI for the GM or player to allocate them following the Base Relations Rule. The GM must manually edit base stats via the PUT endpoint.

3. **Move Learning UI**: Level-up detection reports new moves available but there is no UI to add/replace moves on the Pokemon's active move list. The GM must manually edit the moves JSON.

4. **Breeding System**: eggGroups field exists on the Pokemon model and is populated at generation, but there is no breeding mechanic, egg creation, or inheritance logic.

5. **Training XP System**: trainingExp field exists on the Pokemon model but there is no endpoint or UI for daily training XP grants (PTU Core p.202: half Pokemon level + Command Rank bonus).

6. **Held Item Effects**: heldItem field stored as a string with no mechanical effect. No item database or item effect application during combat or rest.

7. **Ability Effect Application**: Abilities stored as { name, effect } text. No automated ability trigger detection or effect application during combat.

8. **Move Frequency Tracking (Pokemon Sheet)**: While extended-rest and pokemon-center endpoints handle move frequency reset, the Pokemon sheet's move tab has no frequency usage counter or exhaustion indicator visible to the GM.

9. **Multi-form Pokemon Management**: Species with alternate forms (Rotom appliances, Oricorio styles, Darmanitan Zen Mode) are parsed at seed time but there is no runtime form-change mechanic or UI.

10. **Pokedex Viewer**: SpeciesData is seeded and queryable via GET /api/species but there is no dedicated Pokedex browsing UI for the GM or players to look up species reference data.
