---
domain: pokemon-lifecycle
type: capabilities
total_capabilities: 82
mapped_at: 2026-02-26T14:30:00Z
mapped_by: app-capability-mapper
---

# Capabilities: pokemon-lifecycle

# App Capabilities: Pokemon Lifecycle

## Summary
- Total capabilities: 85
- Types: api-endpoint(17), service-function(5), composable-function(11), store-action(7), store-getter(5), component(7), utility(16), constant(4), websocket-event(1), prisma-model(2), prisma-field(10)
- Orphan capabilities: 0

---

## Prisma Models

## Capability Listing

| Cap ID | Name | Type |
|--------|------|------|
| pokemon-lifecycle-C001 | Pokemon Prisma Model | prisma-model |
| pokemon-lifecycle-C002 | SpeciesData Prisma Model | prisma-model |
| pokemon-lifecycle-C003 | origin Field | prisma-field |
| pokemon-lifecycle-C004 | isInLibrary Field (Archive Flag) | prisma-field |
| pokemon-lifecycle-C005 | ownerId Field | prisma-field |
| pokemon-lifecycle-C006 | experience Field | prisma-field |
| pokemon-lifecycle-C007 | level Field | prisma-field |
| pokemon-lifecycle-C008 | tutorPoints Field | prisma-field |
| pokemon-lifecycle-C009 | maxHp Field | prisma-field |
| pokemon-lifecycle-C010 | nature Field | prisma-field |
| pokemon-lifecycle-C011 | moves Field | prisma-field |
| pokemon-lifecycle-C012 | abilities Field | prisma-field |
| pokemon-lifecycle-C013 | NATURE_TABLE | constant |
| pokemon-lifecycle-C014 | EXPERIENCE_CHART | constant |
| pokemon-lifecycle-C015 | SIGNIFICANCE_PRESETS | constant |
| pokemon-lifecycle-C016 | SIGNIFICANCE_PRESET_LABELS | constant |
| pokemon-lifecycle-C017 | applyNatureToBaseStats | utility |
| pokemon-lifecycle-C018 | checkLevelUp | utility |
| pokemon-lifecycle-C019 | summarizeLevelUps | utility |
| pokemon-lifecycle-C020 | calculateEncounterXp | utility |
| pokemon-lifecycle-C021 | calculateLevelUps | utility |
| pokemon-lifecycle-C022 | enrichDefeatedEnemies | utility |
| pokemon-lifecycle-C023 | getXpForLevel | utility |
| pokemon-lifecycle-C024 | getLevelForXp | utility |
| pokemon-lifecycle-C025 | getXpToNextLevel | utility |
| pokemon-lifecycle-C026 | resolvePresetFromMultiplier | utility |
| pokemon-lifecycle-C027 | resolveNickname | utility |
| pokemon-lifecycle-C028 | serializePokemon | utility |
| pokemon-lifecycle-C029 | generatePokemonData | service-function |
| pokemon-lifecycle-C030 | createPokemonRecord | service-function |
| pokemon-lifecycle-C031 | generateAndCreatePokemon | service-function |
| pokemon-lifecycle-C032 | buildPokemonCombatant | service-function |
| pokemon-lifecycle-C033 | distributeStatPoints (internal) | service-function |
| pokemon-lifecycle-C034 | GET /api/pokemon | api-endpoint |
| pokemon-lifecycle-C035 | GET /api/pokemon/:id | api-endpoint |
| pokemon-lifecycle-C036 | POST /api/pokemon | api-endpoint |
| pokemon-lifecycle-C037 | PUT /api/pokemon/:id | api-endpoint |
| pokemon-lifecycle-C038 | DELETE /api/pokemon/:id | api-endpoint |
| pokemon-lifecycle-C039 | POST /api/pokemon/:id/link | api-endpoint |
| pokemon-lifecycle-C040 | POST /api/pokemon/:id/unlink | api-endpoint |
| pokemon-lifecycle-C041 | POST /api/pokemon/bulk-action | api-endpoint |
| pokemon-lifecycle-C042 | POST /api/pokemon/:id/add-experience | api-endpoint |
| pokemon-lifecycle-C043 | POST /api/pokemon/:id/level-up-check | api-endpoint |
| pokemon-lifecycle-C044 | POST /api/encounters/:id/xp-calculate | api-endpoint |
| pokemon-lifecycle-C045 | POST /api/encounters/:id/xp-distribute | api-endpoint |
| pokemon-lifecycle-C046 | GET /api/species | api-endpoint |
| pokemon-lifecycle-C047 | GET /api/player/export/:characterId | api-endpoint |
| pokemon-lifecycle-C048 | POST /api/player/import/:characterId | api-endpoint |
| pokemon-lifecycle-C049 | library.loadLibrary | store-action |
| pokemon-lifecycle-C050 | library.createPokemon | store-action |
| pokemon-lifecycle-C051 | library.updatePokemon | store-action |
| pokemon-lifecycle-C052 | library.deletePokemon | store-action |
| pokemon-lifecycle-C053 | library.linkPokemonToTrainer | store-action |
| pokemon-lifecycle-C054 | library.unlinkPokemon | store-action |
| pokemon-lifecycle-C055 | encounter.calculateXp | store-action |
| pokemon-lifecycle-C056 | encounter.distributeXp | store-action |
| pokemon-lifecycle-C057 | library.filteredPokemon | store-getter |
| pokemon-lifecycle-C058 | library.getPokemonById | store-getter |
| pokemon-lifecycle-C059 | library.getPokemonByOwner | store-getter |
| pokemon-lifecycle-C060 | library.groupedPokemonByLocation | store-getter |
| pokemon-lifecycle-C061 | library.setFilters | store-getter |
| pokemon-lifecycle-C062 | usePokemonSprite.getSpriteUrl | composable-function |
| pokemon-lifecycle-C063 | usePokemonSprite.getStaticSpriteUrl | composable-function |
| pokemon-lifecycle-C064 | usePokemonSprite.getSpriteWithFallback | composable-function |
| pokemon-lifecycle-C065 | usePokemonSprite.getDexNumber | composable-function |
| pokemon-lifecycle-C066 | usePokemonSheetRolls.rollSkill | composable-function |
| pokemon-lifecycle-C067 | usePokemonSheetRolls.rollAttack | composable-function |
| pokemon-lifecycle-C068 | usePokemonSheetRolls.rollDamage | composable-function |
| pokemon-lifecycle-C069 | usePokemonSheetRolls.getMoveDamageFormula | composable-function |
| pokemon-lifecycle-C070 | useCharacterExportImport.handleExport | composable-function |
| pokemon-lifecycle-C071 | useCharacterExportImport.handleImportFile | composable-function |
| pokemon-lifecycle-C072 | PokemonEditForm | component |
| pokemon-lifecycle-C073 | PokemonLevelUpPanel | component |
| pokemon-lifecycle-C074 | PokemonStatsTab | component |
| pokemon-lifecycle-C075 | PokemonMovesTab | component |
| pokemon-lifecycle-C076 | PokemonCapabilitiesTab | component |
| pokemon-lifecycle-C077 | PokemonSkillsTab | component |
| pokemon-lifecycle-C078 | XpDistributionModal | component |
| pokemon-lifecycle-C079 | character_update | websocket-event |
| pokemon-lifecycle-C080 | Pokemon Sheet Page | component |
| pokemon-lifecycle-C081 | XpDistributionResults | component |
| pokemon-lifecycle-C082 | LevelUpNotification | component |
