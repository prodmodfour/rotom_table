# PTU-to-PTR Final Digest

**Goal:** Extract all remaining PTR-relevant rules from the deprecated PTU 1.05 books (`deprecated_books/markdown/`) into the PTR vault (`vaults/ptr/`), then retire the PTU books as a dependency.

**Why:** The PTR vault should be fully self-contained — no one should ever need to consult the deprecated PTU books for game rules. Once this digest is complete, the PTU books become purely historical and the `ptu_books.md` context injection can be removed.

**Scope:** 12 PTU core chapters + errata + playtest packet + useful-charts. Each chapter needs to be read, compared against what's already in the PTR vault (~376 rules notes), and any missing PTR-relevant content digested into new vault notes.

---

## 2026-03-24 — Thread opened

### Approach
1. Work chapter by chapter through `deprecated_books/markdown/core/`
2. For each chapter: read the chapter, search the PTR vault for existing coverage of its topics, identify gaps
3. Digest gaps into new atomic vault notes following `digesting_ptr.md` rules
4. Also process `errata-2.md`, `playtest-packet-2016.md`, and `useful-charts.md`
5. Track progress per-chapter in this thread

### Key question for Ashraf
PTR diverges significantly from PTU. For each chapter, we need to decide:
- **Which rules carried over to PTR unchanged** (digest as-is)
- **Which rules PTR modified** (may already be in vault as PTR versions — verify, don't duplicate)
- **Which rules PTR dropped entirely** (skip — e.g. Abilities, Features, Edges replaced by Traits; Frequencies replaced by Energy)

This means each chapter is a conversation, not a batch job. We read, discuss what's still relevant, then digest.

### Chapter inventory

| # | File | Key Content | Status |
|---|---|---|---|
| 00 | `00-front-matter.md` | Credits, TOC | Skip — not rules |
| 01 | `01-introduction.md` | System overview, dice, core concepts | Done — fully covered, no new notes needed |
| 02 | `02-character-creation.md` | Trainer stats, backgrounds, starters | Done — cleaned up 4 deprecated notes, no new notes needed |
| 03 | `03-skills-edges-and-features.md` | Skills, edges, general features | Done — 19 skill descriptions created, Persuasion added to skill list |
| 04 | `04-trainer-classes.md` | All trainer classes | Skip — replaced in PTR |
| 05 | `05-pokemon.md` | Stats, natures, XP, evolution, capture | Done — natures removed, cleaned up 3 stale notes, 1 new note |
| 06 | `06-playing-the-game.md` | Rounding, skill checks, capabilities, movement | Done — 3 stale notes updated, 2 new notes |
| 07 | `07-combat.md` | Initiative, turns, damage, type chart, switching | Done — 4 new notes, 1 stale note fixed |
| 08 | `08-pokemon-contests.md` | Contests | Skip — removed in PTR |
| 09 | `09-gear-and-items.md` | Balls, items, equipment, TMs, berries | Done — 9 new reference notes |
| 10 | `10-indices-and-reference.md` | Capabilities, abilities, moves | Skip — superseded by ptr_moves/ and ptr_traits/ |
| 11 | `11-running-the-game.md` | GM advice, encounters, XP, habitats, weather | Done — 3 stale notes fixed, no new notes needed |
| — | `errata-2.md` | Rule corrections, experimental content | Done — armor/shield errata adopted, 3 status conditions updated |
| — | `playtest-packet-2016.md` | Experimental rules | Done — Paralysis/Flinch/Infatuation playtest adopted, Suppression removed |
| — | `useful-charts.md` | XP chart, nature chart, reference tables | Done — all content already in vault |

### Decisions from Ashraf
- **Ch 04 (trainer classes):** Skip — PTR replaced the class system entirely
- **Ch 08 (contests):** Skip — removed from PTR
- **Ch 10 (abilities/moves):** Skip — superseded by `ptr_moves/` and `ptr_traits/`

### Remaining chapters (7 + 3 supplements)
03, 05, 06, 07, 09, 11, errata, playtest packet, useful-charts

---

## 2026-03-24 — Ch 01 & Ch 02 processed

**Ch 01:** All mechanical content (dice, grid, shared stats, skills) already covered in PTR vault. Lore primer is franchise background, not system rules. No new notes.

**Ch 02:** Nearly all content is PTU-specific (backgrounds, edges, features, classes, AP, trainer levels 1-50, progression chart, retraining). PTR removed all of these. Cleaned up stale vault notes:
- Deleted: `character-creation-nine-steps.md`, `background-shapes-starting-skills.md`, `pathetic-permanent-at-creation.md`, `starting-skill-cap-novice.md`
- Fixed: `starting-stat-allocation.md` — replaced dangling link to deleted file with `[[trainers-are-human-species]]`
- Dangling links removed: `starting-edge-budget`, `starting-feature-budget`, `edges-and-features-interleave`, `raw-fidelity-as-default`, `skill-ranks-through-edge-slots`, `skill-rank-level-gates`, `max-trainer-level-fifty` (none of these files existed)

---

## 2026-03-24 — Ch 03 processed

**Ch 03:** Edges, features, and general features are all PTU-specific (removed in PTR). Skill descriptions were missing from the vault.

**Bug found:** Persuasion was used throughout the vault (~20 references in traits, moves, social hierarchy) but missing from `ptr-skill-list.md`. Fixed — now lists 19 skills.

**Created 19 skill description notes:**
- 6 physical: `skill-acrobatics.md`, `skill-athletics.md`, `skill-combat.md`, `skill-intimidate.md`, `skill-stealth.md`, `skill-survival.md`
- 6 knowledge: `skill-general-education.md`, `skill-occult-education.md`, `skill-pokemon-education.md`, `skill-technology-education.md`, `skill-medicine.md`, `skill-perception.md`
- 7 social/mental: `skill-deception.md` (was Guile), `skill-charm.md`, `skill-command.md`, `skill-persuasion.md` (new, from D&D), `skill-performance.md` (new to PTR), `skill-insight.md` (was Intuition), `skill-focus.md`

**Updated:** `ptr-skill-list.md` — added Persuasion, linked all 19 skills to their description notes

---

## 2026-03-24 — Ch 05 processed

**Ch 05:** Capture, loyalty, disposition, breeding, mounting, party limit, XP, leveling — all already well-covered (~35 existing notes). Natures, base stat relations, abilities, 6-move limit, tutor points, poke edges, mega evolution, sample builds — all PTU-specific or removed.

**Decision from Ashraf:** Natures do not exist in PTR.

**Created:** `natures-removed.md`

**Cleaned up stale nature references in:**
- `pokemon-creation-ordered-steps.md` — removed natures, six-move-slot-limit, nature-adjusted-base-relations, stat-points-equal-level-plus-ten, trait-unlock-schedule; replaced with correct PTR links
- `evolution-rebuilds-all-stats.md` — removed natures and nature-adjusted-base-relations; replaced with correct PTR links
- `base-stat-relations-removed.md` — removed dangling natures link, added correct see-also links

**Updated:** `ptr-vs-ptu-differences.md` — added natures-removed to levels/stats section

**Created:** `fishing-mechanics.md`, `fossil-mechanics.md` — digested from PTU Ch 05

---

## 2026-03-24 — Ch 06 processed

**Ch 06:** Rounding, percentages, scene boundaries, movement types, throwing range — all already covered. AP section skipped (removed). Capabilities replaced by traits. Player tips are advice, not rules.

**Updated 3 stale notes** (all referenced old Xd6/rank system):
- `opposed-checks-defender-wins-ties.md` — now references 1d20+modifier
- `cooperative-skill-checks.md` — "half helper's rank" → "half helper's modifier"
- `extended-skill-checks.md` — "half their rank in attempts" → "half their modifier in attempts"; added time interval description

**Decision from Ashraf:** "Half their rank" becomes "half their modifier" in PTR.

**Created:** `power-and-lifting.md` (full Power value → weight limit table with Heavy/Staggering/Drag thresholds), `specific-trumps-general.md`

### Frequency system cleanup (triggered by Ch 06 review)

Ashraf confirmed frequencies are gone in PTR. `frequency-replaced-by-energy-costs.md` already said so, but 6 notes still described the old system as active:

**Deleted:**
- `scene-boundary-resets-frequencies.md`
- `daily-moves-once-per-scene.md`
- `scene-frequency-eot-restriction.md`
- `narrative-frequency-option.md`
- `suppressed-frequency-downgrade.md`
- `extended-rest-refreshes-daily-moves.md`

**Fixed inbound links:**
- `tax-vs-threat-encounters.md` — "move frequencies" → "Energy"; linked to `energy-resource` instead
- `encounter-xp-formula.md` — replaced stale see-also
- `extended-rest-clears-persistent-status.md` — removed daily move/AP references, linked to fatigue/rest mechanics instead

---

## 2026-03-24 — Ch 07 processed

**Ch 07 (35 pages):** The largest chapter. Read every page. Combat is already the most thoroughly covered domain in the PTR vault (~50+ existing notes covering initiative, action economy, switching, grid/terrain, combat stages, accuracy, damage formula, type effectiveness, injuries, death, status conditions, maneuvers, resting, and more).

**Created 4 new notes:**
- `damage-base-to-dice-table.md` — full DB 1-28 → dice roll table (was referenced but never defined)
- `suffocation-rules.md` — 1 injury/round after 1 min without air, Gilled immunity
- `precision-skill-checks-in-combat.md` — DC 16 Focus check for delicate tasks under fire
- `improvised-attacks.md` — GM guidelines for non-Move attacks

**Fixed 1 stale note:**
- `struggle-is-not-a-move.md` — "Expert Combat skill rank" → "Combat modifier +5 or higher"

**Skipped (PTU-specific):** Combat demo (uses PTU classes/features/frequencies), Suppressed condition (frequency-based, frequencies removed), sprint maneuver ([[sprint-removed]] already in vault), Struggle-modifying capabilities (Firestarter/Fountain/etc — replaced by traits)

---

## 2026-03-24 — Ch 09 processed (revised)

**Ch 09 (32 pages):** Initially marked as "no new notes needed" since `items-unchanged-from-ptu.md` exists. Revised after Ashraf pointed out that once the PTU books are retired, the reference data they contain needs to live somewhere.

**Created 9 new reference notes:**
- `equipment-slots.md` — 6 trainer equipment slots, equip action costs
- `weapon-system.md` — 4 weapon categories, 3 quality tiers (Crude/Simple/Fine), Struggle modifications, Combat modifier gates
- `armor-and-shields.md` — Light/Heavy armor DR, Light/Heavy shield mechanics
- `snack-and-digestion-buff-system.md` — Snack/Berry/Refreshment mechanics, Digestion Buff rules, common food items with prices
- `x-items-catalog.md` — Full X-Item table with effects and prices
- `held-items-catalog.md` — Full held item table (~30 items with effects and prices)
- `repel-mechanics.md` — 3 repel tiers with level thresholds and direct-spray rules
- `evolution-stones-and-keepsakes.md` — Full stone/keepsake lists with which Pokemon they evolve
- `item-prices-reference.md` — Consolidated quick-reference for all item prices

**Skipped (PTU-specific):** TMs/HMs (universal move access in PTR), Tutor Points (removed), PP Ups (frequency-based), Contest items (contests removed), Weapon Moves with frequencies (frequencies removed), Scrap/Crafting system (Feature-dependent)

---

## 2026-03-24 — Cross-chapter level scale fix

Ashraf flagged: PTR levels are 1-20, not 1-100. Multiple notes had PTU-scale level references. Rule for converting: divide by 4 and round down. Trainer level modifier in capture: removed entirely.

**Created:** `type-effectiveness-chart.md` — full 18-type matchup reference (was only in the PTU book as an image)

**Fixed capture system:**
- `capture-workflow.md` — removed trainer level modifier (trainers have no levels)
- `core-capture-system-1d100.md` — removed dangling `trainer-level-aids-capture` link
- `capture-rate-base-formula.md` — added PTR level range context (base rates 60–98)
- `conditional-poke-ball-bonuses.md` — Nest Ball "level 10" → "level 2"

**Fixed level thresholds (÷4 round down):**
- `fishing-mechanics.md` — Old Rod "level 10" → "level 2"
- `repel-mechanics.md` — levels 15/25/35 → 3/6/8
- `fossil-mechanics.md` — hatch level 10 → level 2

**Fixed stale level-scale notes:**
- `level-up-ordered-steps.md` — removed PTU "Level 20 and 40" trait schedule and `level-up-grants-one-stat-point` link; now references `five-stat-points-per-level`
- `experience-chart-level-thresholds.md` — replaced `pokemon-max-level-hundred` link with `pokemon-level-range-1-to-20`
- `pokemon-party-limit-six.md` — same fix

**Deleted:** `pokemon-max-level-hundred.md` — misnamed PTU-era file (content already said 20, filename said 100)

---

## 2026-03-25 — Ch 11 processed

**Ch 11 (72 pages):** Read all pages. Mostly GM advice (campaign structure, session design, League construction, NPC building, rival design, encounter design philosophy) which is narrative guidance, not mechanical rules. Mechanical sections (encounter XP, budgets, weather, habitats, swarms, quick-statting) were already well-covered in the vault (~24 existing notes).

**Fixed 3 stale notes (trainer level references):**
- `encounter-xp-formula.md` — removed "trainers count as 2× their level"; PTR trainers have no levels
- `encounter-budget-needs-ptu-basis.md` — removed "trainer level × 4" shortcut; noted it no longer applies
- `quick-npc-building.md` — rewrote from PTU Classes/Features/Edges system to PTR Traits/skill modifiers

**No new notes needed.** Encounter creation, XP, weather (4 types), habitats (14 types), quick-statting, shiny Pokemon variants, type changes — all already in the vault. Skill DC table is already PTR-native. The PTU species-by-habitat list (pp.448-453) is reference data available in the Pokedex entries themselves.

### Swarm removal and quick-stat fix (triggered by Ch 11 review)

**Deleted 3 swarm notes** (per Ashraf — swarms removed from PTR):
- `swarm-action-economy.md`, `swarm-hp-bars.md`, `swarm-multiplier-scale.md`

**Fixed 3 inbound links:** `encounter-budget-needs-ptu-basis.md`, `action-economy-per-turn.md`, `action-economy-constrains-encounter-size.md`

**Updated:** `quick-stat-workflow.md` — noted Base Stat Relations are removed, stat allocation is unconstrained, added 5-points-per-level context

---

## 2026-03-25 — Errata, playtest packet, and useful-charts processed

**Errata (Sept 2015):** Mostly PTU class revisions (Cheerleader, Medic) — classes removed. Poke Edge changes — removed. d20 capture — already decided to use 1d100. Tutor move restrictions — tutors removed.

**Adopted from errata:** Armor/shield changes per Ashraf's decision:
- `armor-and-shields.md` — Heavy Shields removed, Shields nerfed to +1 evasion, Light Armor Physical-only, new Special Armor, Heavy Armor reduced to +5 all DR
- `item-prices-reference.md` — updated equipment prices

**Playtest packet (Feb 2016):** Massive ability rework — all replaced by Traits. Status condition revisions adopted per Ashraf's decisions:

**Created 3 new condition notes:**
- `paralysis-condition.md` — playtest version: initiative halved, DC 11 save, partial action on fail + Vulnerable
- `flinch-condition.md` — playtest version: −5 initiative (stacking, scene-long), Vulnerable, no turn skip
- `infatuation-condition.md` — playtest version: −5 damage penalty (or halved Atk/SpAtk vs crush), DC 16 end-of-turn save

**Updated:** `status-cs-auto-apply-with-tracking.md` — removed Paralysis from CS-applying conditions (now halves initiative instead)

**Removed:** Suppression as a status condition (frequency-based, frequencies removed from PTR)

**Kept as-is:** Confusion (core book three-outcome save, already in vault)

**Useful-charts:** All content already in the vault — XP chart (PTR has own), type chart (created), maneuvers (in vault), nature chart (natures removed), status chart (now updated), power chart (created), contest effects (contests removed)

---

## 2026-03-25 — DIGEST COMPLETE

All 12 core chapters + 3 supplements processed. The PTR vault is now self-contained — the deprecated PTU books are no longer needed as a rules reference.

---

## Final reflections

### What we did
Read every page of the PTU 1.05 core rulebook (500+ pages), the Sept 2015 errata, the Feb 2016 playtest packet, and the useful-charts reference. For each chapter, compared the content against the existing PTR vault, identified gaps, and either digested new notes or cleaned up stale ones.

### By the numbers
- **~40 notes created** — skill descriptions (19), item/equipment catalogs (9), reference tables (damage dice, type chart, power/lifting), status conditions (3), missing mechanics (fishing, fossils, suffocation, improvised attacks, precision checks), Water Breathing trait + distribution to 13 Pokemon
- **~25 notes updated** — stale PTU mechanics (Xd6 dice, skill ranks, frequencies, trainer levels, natures, base stat relations, swarms) replaced with PTR equivalents
- **~15 notes deleted** — deprecated PTU-only content (character creation steps, frequency system, swarm mechanics, misnamed files)
- **5 CLAUDE.md files updated** — root, PTR vault, PTR rules, deprecated books, ptu_books context injection

### Key decisions recorded
- Natures: removed entirely
- Frequencies: removed entirely (energy system replaces)
- Swarms: removed
- Suppression condition: removed (frequency-based)
- Capture system: 1d100 (errata d20 not adopted)
- Trainer levels: removed (no level modifier in capture)
- Level scale: PTU thresholds ÷ 4 round down for PTR's 1-20 range
- Armor/shields: errata version adopted (Physical/Special/Heavy split, shields nerfed)
- Paralysis/Flinch/Infatuation: 2016 playtest versions adopted (act-but-penalized over lose-your-turn)
- Confusion: core book version kept
- Persuasion: 19th skill, was missing from skill list despite ~20 vault references
- Performance: new PTR skill, no PTU equivalent
- Water Breathing: new trait replacing PTU's Gilled capability
- Combat turn structure: no system-level limit on Pokemon per trainer (GM handles this)

### What made this work well
The conversational chapter-by-chapter approach let Ashraf make design decisions in context rather than in the abstract. Several important things surfaced only because we were reading carefully: the missing Persuasion skill, the stale frequency notes, the level-scale problem, the need to preserve reference data we'd lose after retiring the books. The "are you sure?" moment on Ch 09 prevented a real gap.

### Thread status: CLOSED
