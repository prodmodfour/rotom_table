---
review_id: rules-review-129
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-003
domain: player-view
commits_reviewed:
  - 7dc6b2a
  - 1b747fc
  - 9323b32
  - 1684b4b
  - 24c0986
  - 2817204
  - 503ede6
  - ea9e960
  - 27891ee
  - 03853b2
  - 0706de5
mechanics_verified:
  - information-visibility
  - combat-action-categorization
  - websocket-player-action-types
  - evasion-display
  - struggle-definition
  - pokemon-switching-action-economy
  - hp-display
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Action-Types
  - core/07-combat.md#Pokemon-Switching
  - core/07-combat.md#Struggle-Attacks
  - core/11-running-the-game.md#Pokemon-Knowledge
  - core/03-skills-edges-and-features.md#Pokemon-Education
  - core/02-character-creation.md#Trainer-Hit-Points
reviewed_at: 2026-02-23T10:15:00Z
follows_up: (none -- first review)
---

## Mechanics Verified

### 1. Information Visibility (Enemy vs Ally vs Own)

- **Rule:** "Trainers would typically know quite a lot when it comes to basic Pokémon knowledge, so long as they have at least Untrained Pokémon Education. What Types a Pokémon has, how the Types interact, and even basic qualitative knowledge about how a particular species tends to battle is all assumed to be common sense or part of basic education in the Pokémon world." (`core/11-running-the-game.md` p.453)
- **Rule:** "more detailed information that one would find in the Pokédex such as when specific Moves are learned will generally require higher Ranks in Pokémon Education to recall from memory." (`core/03-skills-edges-and-features.md` p.44)
- **Implementation:** `PlayerCombatantInfo.vue:149-164` implements a three-tier visibility model:
  - **Own** (`entityId === myCharacterId || myPokemonIds.includes(entityId)`): Full visibility -- exact HP, stats, moves, abilities, injuries.
  - **Ally** (`side === 'players' || side === 'allies'` and not own): Exact HP, no stats/moves/abilities, injuries visible.
  - **Enemy** (all others): HP percentage only, no stats/moves/abilities/injuries.
  - Types are always shown for Pokemon (`PlayerCombatantInfo.vue:29`).
  - Status conditions are always shown (`PlayerCombatantInfo.vue:60`).
- **Status:** CORRECT. Types being universally visible aligns with PTU's statement that type knowledge is "common sense." Status conditions being visible is a reasonable design decision -- PTU describes physical observable effects (Burned creatures are on fire, Frozen are encased in ice, Paralyzed twitch). HP percentage for enemies is a valid abstraction of the PTU "it looks hurt" qualitative assessment. The three-tier model does not contradict any PTU rule. The design spec correctly notes (Section 5.1) that knowledge checks could be added as a future enhancement for dynamic visibility, but the current static model is an acceptable simplification for P0.

**Edge case verified:** The `isOwn` check runs before `isAlly`, so a player's own combatants on the 'players' side correctly receive full visibility, not the reduced ally visibility. Other players' Pokemon on the 'players' side correctly receive ally-level visibility.

### 2. Combat Action Categorization (Direct vs Requested)

- **Rule:** PTU Chapter 7 (`core/07-combat.md` p.227-228) defines action types:
  - Standard Actions: "Using a Move", "Using a Struggle Attack", "Retrieving and using an Item from a backpack", "Use Combat Maneuvers"
  - Shift Actions: "Returning a Pokémon, or sending out a Pokémon", "Returning a Fainted Pokémon and sending out a replacement Pokémon"
  - Full Pokémon Switch: "A full Pokémon Switch requires a Standard Action" (`core/07-combat.md` p.229)
- **Implementation:** `PlayerActionRequest` in `app/types/api.ts:65-77` defines seven action types: `use_move`, `shift`, `struggle`, `pass`, `use_item`, `switch_pokemon`, `maneuver`.
- **Design split (Section 4.3):**
  - **Direct actions** (client calls server API): `use_move`, `shift`, `struggle`, `pass`
  - **Requested actions** (WS message to GM): `use_item`, `switch_pokemon`, `maneuver`
- **Status:** CORRECT. The direct/requested split correctly reflects which actions have deterministic server-side logic (moves, shift, struggle, pass) versus which require GM judgment (items, switches, maneuvers). The PTU action type mapping is accurate:
  - `use_move` = Standard Action (correct)
  - `struggle` = Standard Action (correct, PTU p.240: "Struggle Attacks may be used...as a Standard Action")
  - `shift` = Shift Action (correct)
  - `pass` = not a PTU action type, just ends the turn (correct)
  - `use_item` = Standard Action (correct, PTU p.227: "Retrieving and using an Item")
  - `switch_pokemon` = Standard Action for full switch, or Shift Action for fainted/individual recall/release (correct, PTU p.229)
  - `maneuver` = Standard Action (correct, PTU p.227: "Use Combat Maneuvers")

### 3. WebSocket `player_action` Message Types

- **Rule:** N/A -- this is infrastructure, not a PTU mechanic. However, the action types carried in the WebSocket message must map to valid PTU actions.
- **Implementation:** `app/server/routes/ws.ts:194-209` forwards `player_action` messages from `player` or `group` role clients to GM(s) in the same encounter. `app/types/api.ts:65-77` defines the `PlayerActionRequest` interface with typed action field and optional context fields (moveId, targetIds, itemId, pokemonId, maneuverId, etc.).
- **Status:** CORRECT. The `PlayerActionRequest.action` union type (`'use_move' | 'shift' | 'struggle' | 'pass' | 'use_item' | 'switch_pokemon' | 'maneuver'`) covers the full PTU player combat action set. The optional fields are correctly typed per action: moves need `moveId`/`targetIds`, items need `itemId`/`itemName`, switches need `pokemonId`, maneuvers need `maneuverId`/`targetId`. The forwarding-to-GM-only pattern correctly preserves GM authority.

### 4. Evasion Display (Character Sheet)

- **Rule:** "Evasion = floor(calculatedStat / 5)" capped at 6 per stat. (`core/07-combat.md` p.237-238)
- **Implementation:** `PlayerCharacterSheet.vue:248-256` computes evasion using `calculateEvasion(props.character.stats.defense, props.character.stageModifiers.defense ?? 0)` from `app/utils/damageCalculation.ts:102-109`. The `calculateEvasion` function applies stage modifiers to the stat, divides by 5, floors, caps at 6, and adds bonus evasion (clamped to min 0).
- **Status:** CORRECT. For trainers, `character.stats` contains the calculated combat stats (assigned at character creation). The evasion calculation correctly uses these calculated stats with stage modifiers. The +6 cap (`Math.min(6, ...)`) and floor division are both present.

### 5. Struggle Definition (Design Spec)

- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type. [...] Never apply STAB to Struggle Attacks. Struggle Attacks do not count as Moves." (`core/07-combat.md` p.240)
- **Rule (Expert modifier):** "if a Trainer or Pokémon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5." (`core/07-combat.md` p.240)
- **Implementation:** The design spec Section 4.7 defines a `struggleMove` constant with `ac: 4, damageBase: 4, range: 'Melee', type: 'Normal', damageClass: 'Physical'`. The effect text mentions the Expert+ modifier ("Expert+ Combat Skill: AC 3, DB 5").
- **Status:** CORRECT. The base Struggle definition matches PTU exactly. The Expert modifier is documented in the effect text. Note: the `struggleMove` in the design spec is a *design-time* specification -- P0 does not implement combat actions (that is P1). When P1 implements Struggle execution, it must apply the Expert+ modifier server-side, not just display it in the effect text.

### 6. Pokemon Switching Action Economy

- **Rule:** "A full Pokémon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokémon on their respective Initiative Counts." (`core/07-combat.md` p.229)
- **Rule:** "Trainers may Switch out Fainted Pokémon as a Shift Action." (`core/07-combat.md` p.229)
- **Rule:** "Recall and Release actions can also be taken individually by a Trainer as Shift Actions." (`core/07-combat.md` p.229)
- **Implementation:** The design spec Section 4.2 correctly documents: "Switch Pokemon | Standard (full switch) / Shift (recall or release individually, or fainted)". The `switch_pokemon` action in `PlayerActionRequest` is a **request** (not direct), meaning the GM determines the correct action economy when executing it.
- **Status:** CORRECT. By making `switch_pokemon` a GM-approved request, the implementation avoids the complexity of determining action economy (Standard vs Shift) on the client. The GM can apply the correct PTU rules (full switch = Standard, fainted switch = Shift, individual recall/release = Shift each). This is the right architectural decision.

### 7. HP Display (Own Character and Pokemon)

- **Rule (Trainer HP):** "Trainer Hit Points = Trainer's Level x2 + (HP stat x3) + 10" (`core/07-combat.md` p.236, `core/02-character-creation.md` p.35)
- **Rule (Pokemon HP):** `level + (baseHp * 3) + 10` (standard PTU formula)
- **Implementation:** The player view displays `character.currentHp / character.maxHp` and `pokemon.currentHp / pokemon.maxHp` from server-stored values. It does NOT calculate HP -- it reads the pre-computed `maxHp` from the database. The `PlayerCharacterSheet.vue:25` shows `{{ character.currentHp }} / {{ character.maxHp }} HP`. The `PlayerPokemonCard.vue:42` shows `{{ pokemon.currentHp }} / {{ pokemon.maxHp }}`.
- **Status:** CORRECT. The player view is read-only and correctly displays server-stored HP values. It does not recompute HP formulas, which is the correct approach since the server is the source of truth.

## Summary

The P0 Player View implementation correctly handles all PTU mechanics within its scope. The information visibility model (three-tier: own/ally/enemy) is a reasonable simplification of PTU's knowledge check system, with types and status conditions universally visible per the rulebook's guidance that these are "common sense." The combat action categorization (direct vs requested) correctly maps to PTU action types and preserves GM authority over judgment-dependent actions. Evasion display uses the correct `calculateEvasion` utility with stage modifiers.

One MEDIUM observation is noted below regarding Trainer HP stat display context.

## Rulings

### MEDIUM: Trainer Stats Display Shows Raw Stats Without Context

- **File:** `app/components/player/PlayerCharacterSheet.vue:234-245`
- **Observation:** The stats grid displays `character.stats.hp` (the raw HP stat value, e.g. 13) alongside `character.currentHp / character.maxHp` (the derived HP total, e.g. 57/57). While not PTU-incorrect (the raw stat IS a real value), this could cause player confusion because the "HP" stat cell shows 13 while the header HP bar shows 57/57. In PTU, the HP combat stat is used to calculate max HP via the formula (`level*2 + HP*3 + 10`), but players unfamiliar with the formula may not understand why the stat says "13" when their HP is "57."
- **PTU Reference:** "Trainer Hit Points = Trainer's Level x2 + (HP stat x3) + 10" (`core/02-character-creation.md` p.35)
- **Impact:** UX confusion, not mechanical incorrectness. The displayed value IS the correct PTU stat.
- **Recommendation:** Consider labeling the stat cell as "HP Base" or adding a tooltip explaining the HP formula. This is a UX enhancement, not a rules fix.

## Verdict

**APPROVED**

No PTU rule violations found. All seven verified mechanics are correctly implemented or correctly delegated to the GM (via the request model). The information visibility model is a reasonable P0 simplification that aligns with PTU's guidance on common Pokemon knowledge. The single MEDIUM finding is a UX concern (stat display context), not a mechanical error.

## Required Changes

None. The MEDIUM observation is a UX suggestion and does not require changes before proceeding to P1.
