---
domain: pokemon-lifecycle
type: audit-tier
tier: 5
name: Supporting Capabilities
items_audited: 5
correct: 5
incorrect: 0
approximation: 0
ambiguous: 0
audited_at: 2026-03-05T18:00:00Z
audited_by: implementation-auditor
session: 121
---

# Tier 5: Supporting Capabilities

5 items verifying integration of supporting capabilities.

---

## Item 36: C028 -- serializePokemon

**Rule:** N/A (integration verification). JSON fields must be parsed correctly.

**Expected behavior:** `serializePokemon()` correctly parses all JSON-as-TEXT fields (nature, abilities, moves, capabilities, skills, eggGroups, statusConditions, stageModifiers).

**Actual behavior:** `app/server/utils/serializers.ts:207-262` (`serializePokemon()`):
- `nature: JSON.parse(pokemon.nature)` (line 214) -- parses `{ name, raisedStat, loweredStat }`.
- `abilities: JSON.parse(pokemon.abilities)` (line 235) -- parses array of ability objects.
- `moves: JSON.parse(pokemon.moves)` (line 236) -- parses array of move detail objects.
- `capabilities: JSON.parse(pokemon.capabilities)` (line 238) -- parses capabilities object.
- `skills: JSON.parse(pokemon.skills)` (line 239) -- parses skill dice formulas.
- `eggGroups: JSON.parse(pokemon.eggGroups)` (line 242) -- parses array.
- `statusConditions: JSON.parse(pokemon.statusConditions)` (line 245) -- parses array.
- `stageModifiers: JSON.parse(pokemon.stageModifiers)` (line 234) -- parses object.
- `types: pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1]` (line 215) -- correctly constructs 1-2 element array.
- `baseStats` and `currentStats` are correctly reconstructed from individual DB columns (lines 216-231).
- `loyalty` field includes a fallback for legacy records without the field (line 244).

All JSON fields correctly parsed. Used by all Pokemon GET/PUT/POST response paths.

**Classification:** Correct

---

## Item 37: C027 -- resolveNickname

**Rule:** N/A (integration verification). Auto-naming when no nickname provided.

**Expected behavior:** `resolveNickname()` returns "Species N+1" when no nickname given.

**Actual behavior:** `app/server/utils/pokemon-nickname.ts:3-7`:
```typescript
export async function resolveNickname(species: string, nickname?: string | null): Promise<string> {
  if (nickname?.trim()) return nickname.trim()
  const count = await prisma.pokemon.count({ where: { species } })
  return `${species} ${count + 1}`
}
```
- If a non-empty nickname is provided, returns it trimmed.
- Otherwise, counts existing Pokemon of that species in DB and returns "Species N+1" (e.g., "Pikachu 3").
- Used in `createPokemonRecord()` (line 217) and PUT endpoint (line 22).

**Classification:** Correct

---

## Item 38: C079 -- character_update WebSocket Event

**Rule:** N/A (integration verification). WebSocket broadcast on Pokemon updates reaches all clients.

**Expected behavior:** `character_update` event broadcast to all connected clients when Pokemon data changes.

**Actual behavior:** `app/server/routes/ws.ts:484-487`:
```
case 'character_update':
  // Character data changed
  broadcast(event, peer)
  break
```
- The `character_update` event is relayed via broadcast to all connected peers.
- Client-side stores listen for this event and refresh their data.
- This enables GM-to-Group synchronization when Pokemon are updated (level-up, XP distribution, evolution, stat changes, etc.).

**Classification:** Correct

---

## Item 39: C047, C048, C070, C071 -- Player Export/Import

**Rule:** N/A (integration verification). Player export/import preserves Pokemon data integrity.

**Expected behavior:** Export creates a portable character+Pokemon bundle. Import recreates the character and linked Pokemon.

**Actual behavior:**
- **Export:** `app/server/api/player/export/[characterId].get.ts` -- exports character data with all linked Pokemon.
- **Import:** `app/server/api/player/import/[characterId].post.ts` -- imports character data and recreates Pokemon records.
- **Client composables:** `useCharacterExportImport` (C070/C071) provides `handleExport` and `handleImportFile` functions.
- Export serializes all Pokemon fields including the full JSON fields (nature, abilities, moves, capabilities, skills). Import calls through the Pokemon creation pipeline, preserving all data.

**Classification:** Correct

---

## Item 40: C062-C065 -- Sprite Resolution Chain

**Rule:** N/A (integration verification). Sprite resolution: B2W2 for Gen 1-5, Showdown for Gen 6+, fallback chain.

**Expected behavior:** Gen 1-5 use B2W2 animated sprites, Gen 6+ use Showdown sprites, with fallback chain.

**Actual behavior:** `app/composables/usePokemonSprite.ts`:
- `dexNumbers` record (lines 152-308): Complete mapping of Gen 1-5 species (1-649) to dex numbers.
- `showdownNames` record (lines 6-149): 280+ special name mappings for Showdown sprite URLs (regional forms, special characters).
- `getSpriteUrl()` (lines 343-358):
  - Gen 5 and earlier (dexNum <= 649): Uses PokeAPI B2W2 animated sprites (`generation-v/black-white/animated/{dexNum}.gif`).
  - Gen 6+: Uses Showdown animated sprites (`play.pokemonshowdown.com/sprites/ani/{name}.gif`).
  - Shiny variants supported for both paths.
- `getStaticSpriteUrl()` (lines 361-378): Fallback to static PNG sprites.
- `getSpriteWithFallback()` (lines 416-436): Tries animated, then B2W2 animated, then static, then placeholder.
- `getDexNumber()` (lines 337-340): Looks up dex number from normalized species name.

**Classification:** Correct
