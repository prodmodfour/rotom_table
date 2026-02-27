# Healing Domain — Gameplay Loops

---

## Tier 1: Session Workflows

---

### W1: Post-Combat Party Quick Rest

---
loop_id: healing-workflow-post-combat-quick-rest
tier: workflow
domain: healing
gm_intent: Heal wounded party members between encounters using 30-minute rests
ptu_refs:
  - core/07-combat.md#Resting
app_features:
  - composables/useRestHealing.ts
  - utils/restHealing.ts
  - components/common/HealingTab.vue
  - server/api/characters/[id]/rest.post.ts
  - server/api/pokemon/[id]/rest.post.ts
mechanics_exercised:
  - rest-hp-calculation
  - daily-rest-cap
  - injury-rest-block
  - daily-counter-auto-reset
sub_workflows:
  - healing-workflow-post-combat-quick-rest-blocked-by-injuries
  - healing-workflow-post-combat-quick-rest-at-daily-cap
---

#### GM Context

Combat just ended. Several party members and their Pokemon took damage. The GM wants to heal the party before the next encounter without committing to a long rest. This is the most common healing action during a session — the "quick patch up" between fights.

#### Preconditions

- At least one character or Pokemon exists with currentHp < maxHp
- Entity has fewer than 5 injuries
- Entity has not already rested 480 minutes today

#### Workflow Steps

1. **[Setup]** GM navigates to a character or Pokemon sheet (`/gm/characters/:id` or `/gm/pokemon/:id`) and selects the Healing tab
2. **[Setup]** GM reviews the healing status panel: current HP, max HP, injuries count, rest minutes used today, HP per rest amount
3. **[Action]** GM clicks "Rest 30 min" button
4. **[Mechanic: rest-hp-calculation]** Server calculates HP healed: `max(1, floor(maxHp / 16))`, capped at `maxHp - currentHp`
5. **[Mechanic: daily-rest-cap]** Server increments `restMinutesToday` by 30 (blocks if already at 480)
6. **[Mechanic: daily-counter-auto-reset]** Server checks `lastRestReset` — if on a different calendar day, resets `restMinutesToday` and `injuriesHealedToday` to 0 before calculating
7. **[Bookkeeping]** UI displays success message with HP healed amount, updates healing status panel
8. **[Action]** GM repeats steps 1-7 for each wounded party member and their Pokemon
9. **[Done]** All party members have recovered partial HP; GM returns to encounter/scene view to continue the session

#### PTU Rules Applied

- Rest healing rate: "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points." (core/07-combat.md, Resting)
- 5+ injury block: "a Trainer or Pokemon is unable to restore Hit Points through rest if the individual has 5 or more injuries" (core/07-combat.md, Resting)

#### Expected End State

- Entity's `currentHp` increased by the calculated heal amount (never exceeding `maxHp`)
- Entity's `restMinutesToday` increased by 30
- HealingTab UI updates to show new HP and remaining rest time
- Success message displayed in the healing result banner

#### Variations

- **Blocked by injuries (5+)**: Entity has 5+ injuries — "Rest 30 min" button is disabled, UI shows "(Cannot rest-heal)" warning next to injury count. GM must heal injuries first (via Pokemon Center or natural healing) before rest-healing HP. → healing-workflow-post-combat-quick-rest-blocked-by-injuries
- **Daily rest cap reached**: Entity has already rested 480 minutes — button disabled, server returns "Already rested maximum 8 hours today". GM must wait for new day reset. → healing-workflow-post-combat-quick-rest-at-daily-cap
- **Already at full HP**: Entity already at max HP — button disabled, no API call made

---

### W2: Overnight Extended Rest

---
loop_id: healing-workflow-overnight-extended-rest
tier: workflow
domain: healing
gm_intent: Camp the party overnight to restore HP, clear persistent status conditions, and restore depleted resources
ptu_refs:
  - core/07-combat.md#Resting
  - core/07-combat.md#Extended-Rest
app_features:
  - composables/useRestHealing.ts
  - utils/restHealing.ts
  - components/common/HealingTab.vue
  - server/api/characters/[id]/extended-rest.post.ts
  - server/api/pokemon/[id]/extended-rest.post.ts
mechanics_exercised:
  - rest-hp-calculation
  - extended-rest-status-clearing
  - drained-ap-restoration
  - daily-move-recovery
  - daily-rest-cap
  - injury-rest-block
sub_workflows:
  - healing-workflow-overnight-extended-rest-pokemon-moves
---

#### GM Context

The party has camped for the night or is taking a long break (4+ hours). This is a major recovery event — HP recovery over 8 rest periods, persistent status conditions cleared, trainer AP restored, Pokemon daily-frequency moves regained. Typically happens once per in-game day.

#### Preconditions

- At least one character or Pokemon exists (wounded, status-afflicted, AP-drained, or with used daily moves)
- Party is in a safe location suitable for extended rest

#### Workflow Steps

1. **[Setup]** GM navigates to a character sheet (`/gm/characters/:id`) and selects the Healing tab
2. **[Setup]** GM reviews current status: HP deficit, persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned), drained AP count
3. **[Action]** GM clicks "Extended Rest" button
4. **[Mechanic: rest-hp-calculation]** Server applies up to 8 consecutive 30-minute rest periods, each healing `max(1, floor(maxHp / 16))` HP. Stops early if entity reaches max HP, hits daily rest cap, or has 5+ injuries
5. **[Mechanic: extended-rest-status-clearing]** Server removes all persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) from the entity's `statusConditions` array. Volatile and other conditions are NOT removed
6. **[Mechanic: drained-ap-restoration]** For characters only: server sets `drainedAp` to 0
7. **[Mechanic: daily-rest-cap]** Server increments `restMinutesToday` by 30 per period applied (up to 240 minutes for 8 periods)
8. **[Bookkeeping]** UI displays success message with total HP healed, cleared statuses, and AP restored
9. **[Action]** GM navigates to a Pokemon sheet (`/gm/pokemon/:id`) and clicks "Extended Rest"
10. **[Mechanic: daily-move-recovery]** For Pokemon only: server resets `usedToday` to 0 on all moves and resets `usedThisScene` to 0 on daily-frequency moves
11. **[Bookkeeping]** UI displays success message including restored move names
12. **[Action]** GM repeats steps 1-11 for each party member and their Pokemon
13. **[Done]** All party members have recovered HP, lost persistent statuses, restored AP/moves — party is ready for the new day

#### PTU Rules Applied

- Extended rest definition: "Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP." (core/07-combat.md, Resting)
- Daily move recovery: "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day." (core/07-combat.md, Resting)
- Rest HP rate: "heal 1/16th of their Maximum Hit Points" per 30 minutes (core/07-combat.md, Resting)

#### Expected End State

- Characters: `currentHp` increased (up to `maxHp`), `statusConditions` cleared of persistent conditions, `drainedAp` set to 0, `restMinutesToday` increased by total rest minutes
- Pokemon: same HP/status recovery plus `moves` JSON updated with `usedToday: 0` and daily-frequency `usedThisScene: 0`
- API response includes `hpHealed`, `clearedStatuses`, `apRestored` (character) or `restoredMoves` (Pokemon)

#### Variations

- **Pokemon with daily moves used**: Extended rest resets move frequency counters → Server response includes `restoredMoves` array listing which moves were restored → healing-workflow-overnight-extended-rest-pokemon-moves
- **Entity with 5+ injuries**: HP healing portion is blocked (injuries ≥ 5), but status clearing, AP restoration, and move recovery still proceed normally. HP portion returns 0 healed
- **Entity with no remaining rest minutes**: Already at 480 minutes for the day — HP healing portion returns 0, but status/AP/move effects still apply

---

### W3: Pokemon Center Full Heal

---
loop_id: healing-workflow-pokemon-center-full-heal
tier: workflow
domain: healing
gm_intent: Fully heal the party at a Pokemon Center — restore HP, clear all status, heal injuries, restore moves
ptu_refs:
  - core/07-combat.md#Pokemon-Centers
app_features:
  - composables/useRestHealing.ts
  - utils/restHealing.ts
  - components/common/HealingTab.vue
  - server/api/characters/[id]/pokemon-center.post.ts
  - server/api/pokemon/[id]/pokemon-center.post.ts
mechanics_exercised:
  - pokemon-center-full-heal
  - pokemon-center-injury-cap
  - pokemon-center-time-calculation
  - status-clearing-all
  - daily-move-recovery
tactical_decisions:
  - heal-now-vs-wait-for-natural-injury-healing
sub_workflows:
  - healing-workflow-pokemon-center-at-injury-cap
---

#### GM Context

The party has reached a town with a Pokemon Center. This is the most comprehensive healing option — full HP restoration, all status conditions cleared, injuries healed (up to 3/day), and daily moves restored. The GM needs to know the time cost (base 1 hour + injury penalties) for narrative pacing.

#### Preconditions

- At least one character or Pokemon needs healing
- Party has access to a Pokemon Center (narrative/location requirement)

#### Workflow Steps

1. **[Setup]** GM navigates to a character or Pokemon sheet and selects the Healing tab
2. **[Setup]** GM reviews current state: HP, injuries, status conditions, injuries healed today count
3. **[Decision: heal-now-vs-wait]** If entity has injuries but `injuriesHealedToday` is already at 3, GM may decide to wait for new day before visiting the Pokemon Center to maximize injury healing
4. **[Action]** GM clicks "Pokemon Center" button
5. **[Mechanic: pokemon-center-full-heal]** Server sets `currentHp` to `maxHp`, clears ALL status conditions (persistent + volatile + other)
6. **[Mechanic: pokemon-center-injury-cap]** Server calculates injuries to heal: `min(injuries, max(0, 3 - injuriesHealedToday))`. Increments `injuriesHealedToday`. If all injuries healed, sets `lastInjuryTime` to null
7. **[Mechanic: pokemon-center-time-calculation]** Server calculates healing time: 60 min base + 30 min per injury (or 60 min per injury if 5+). Returns `healingTime` and `healingTimeDescription` for narrative use
8. **[Mechanic: daily-move-recovery]** For Pokemon: resets all move usage (`usedToday` and `usedThisScene` both set to 0)
9. **[Bookkeeping]** UI displays success message with HP healed, injuries healed, remaining injuries, cleared statuses, healing time description, and daily injury limit status
10. **[Action]** GM repeats for each party member and Pokemon
11. **[Done]** Party is fully healed (within daily injury limits). GM notes the in-game time elapsed for narrative purposes

#### PTU Rules Applied

- Pokemon Center healing: "In a mere hour, Pokemon Centers can heal a Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves." (core/07-combat.md, Pokemon Centers)
- Injury time penalty: "For each Injury on the Trainer or Pokemon, Healing takes an additional 30 minutes. If the Trainer or Pokemon has five or more Injuries, it takes one additional hour per Injury instead." (core/07-combat.md, Pokemon Centers)
- Injury daily cap: "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total." (core/07-combat.md, Pokemon Centers)

#### Expected End State

- Entity `currentHp` equals `maxHp`
- `statusConditions` is empty array `[]`
- `injuries` decreased by amount healed (0 if under daily cap)
- `injuriesHealedToday` increased by injuries healed
- Pokemon moves: all `usedToday` and `usedThisScene` reset to 0
- API response includes `healingTimeDescription` for narrative pacing (e.g., "2 hours 30 minutes")

#### Variations

- **At daily injury cap**: Entity has injuries but `injuriesHealedToday` is already 3. Pokemon Center still heals HP, clears status, restores moves — but `injuriesHealed` is 0. Response includes `atDailyInjuryLimit: true`. GM must wait for new day to heal more injuries. → healing-workflow-pokemon-center-at-injury-cap
- **No injuries**: Simpler case — 1 hour healing time, no injury cap logic. Full heal otherwise identical
- **5+ injuries**: Healing time formula switches to 60 min per injury (not 30 min). Injuries still subject to daily cap

---

### W4: Injury Healing Cycle

---
loop_id: healing-workflow-injury-healing-cycle
tier: workflow
domain: healing
gm_intent: Manage a party member's injuries over time using natural healing and trainer AP drain
ptu_refs:
  - core/07-combat.md#Injuries
  - core/07-combat.md#Pokemon-Centers
app_features:
  - composables/useRestHealing.ts
  - utils/restHealing.ts
  - components/common/HealingTab.vue
  - server/api/characters/[id]/heal-injury.post.ts
  - server/api/pokemon/[id]/heal-injury.post.ts
mechanics_exercised:
  - natural-injury-healing-timer
  - ap-drain-injury-healing
  - daily-injury-cap
  - last-injury-time-tracking
tactical_decisions:
  - natural-vs-ap-drain
sub_workflows:
  - healing-workflow-injury-healing-natural-only
  - healing-workflow-injury-healing-ap-drain
---

#### GM Context

A party member has accumulated injuries from combat (via massive damage or HP markers). The GM needs to manage their recovery over in-game time. Natural healing requires 24 hours without new injuries. Trainers can alternatively drain 2 AP to heal an injury immediately. Both methods share the daily cap of 3 injuries.

#### Preconditions

- Entity has `injuries > 0`
- For natural healing: `lastInjuryTime` is set and at least 24 hours have passed
- For AP drain: entity is a character (not Pokemon)

#### Workflow Steps

1. **[Setup]** GM navigates to entity sheet → Healing tab → reviews "Time Since Last Injury" display
2. **[Setup]** GM checks: does the entity qualify for natural healing? UI shows hours since last injury and countdown to 24h threshold. Also checks `injuriesHealedToday` (max 3/day)
3. **[Decision: natural-vs-ap-drain]** GM decides: wait for 24h timer (free but slow), or drain AP (costs 2 AP but immediate, trainers only). If Pokemon, only natural healing is available
4. **[Action — Natural]** If 24h has passed, GM clicks "Heal Injury Naturally" button
5. **[Mechanic: natural-injury-healing-timer]** Server verifies `lastInjuryTime` is 24+ hours ago. If injuries remain after healing, resets `lastInjuryTime` to now (restarting the 24h timer). If no injuries remain, sets `lastInjuryTime` to null
6. **[Action — AP Drain]** Alternatively, for trainers, GM clicks "Drain 2 AP" button
7. **[Mechanic: ap-drain-injury-healing]** Server decrements `injuries` by 1, increments `drainedAp` by 2. No time check required
8. **[Mechanic: daily-injury-cap]** Both methods increment `injuriesHealedToday`. Server blocks if already at 3
9. **[Mechanic: last-injury-time-tracking]** After healing, if injuries remain, `lastInjuryTime` resets (natural) or stays unchanged (AP drain). If 0 injuries remain, `lastInjuryTime` set to null
10. **[Bookkeeping]** UI updates injury count, injuries healed today counter, and (for AP drain) drained AP display
11. **[Done]** Injury healed. If more injuries remain, GM must wait for next natural heal cycle or drain more AP (within daily cap)

#### PTU Rules Applied

- Natural healing: "If a Pokemon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries." (core/07-combat.md, Injuries)
- AP drain: "Trainers can also remove Injuries as an Extended Action by Draining 2 AP. This is subject to the limitations on healing Injuries each day." (core/07-combat.md, Injuries)
- Daily cap: "only 3 Injuries can be removed per day through any combination of Items, Features, or Natural Healing" (core/07-combat.md, Pokemon Centers & core/09-gear-and-items.md, Bandages)

#### Expected End State

- `injuries` decremented by 1
- `injuriesHealedToday` incremented by 1
- Natural path: `lastInjuryTime` reset to now (if injuries remain) or null (if 0)
- AP drain path: `drainedAp` incremented by 2
- Healing tab UI refreshes all counters

#### Variations

- **Natural healing only (Pokemon)**: Pokemon cannot drain AP — only natural healing and Pokemon Center are available. "Drain 2 AP" button is hidden for Pokemon entities → healing-workflow-injury-healing-natural-only
- **AP drain (trainers)**: Trainer uses AP drain for immediate healing. More flexible but costs a scarce resource → healing-workflow-injury-healing-ap-drain
- **At daily cap**: `injuriesHealedToday >= 3` — both buttons disabled. Must wait for new day
- **No lastInjuryTime set**: If `lastInjuryTime` is null, natural healing is unavailable (the 24h timer has no reference point). This occurs when injuries are gained without the time being recorded, or after a previous full recovery

---

### W5: Global New Day Reset

---
loop_id: healing-workflow-global-new-day-reset
tier: workflow
domain: healing
gm_intent: Start a new in-game day, resetting all daily healing limits across the entire party
ptu_refs:
  - core/07-combat.md#Resting
  - core/07-combat.md#Pokemon-Centers
app_features:
  - composables/useRestHealing.ts
  - server/api/game/new-day.post.ts
  - server/api/characters/[id]/new-day.post.ts
  - server/api/pokemon/[id]/new-day.post.ts
mechanics_exercised:
  - new-day-counter-reset
  - new-day-scope
sub_workflows:
  - healing-workflow-individual-new-day
---

#### GM Context

A new in-game day has started (or the GM is starting a new session). Daily healing limits need to be reset for all entities: rest minutes, injury healing counter, and drained AP. This is typically done once at the start of each session or when in-game time advances past midnight.

#### Preconditions

- At least one character or Pokemon exists in the system
- GM has decided the in-game day has changed

#### Workflow Steps

1. **[Setup]** GM decides the in-game day has advanced (narrative trigger — no mechanical check)
2. **[Action]** GM triggers global new day via the app (calls `POST /api/game/new-day`)
3. **[Mechanic: new-day-counter-reset]** Server uses `prisma.pokemon.updateMany` and `prisma.humanCharacter.updateMany` (no filter — updates ALL records) to reset: `restMinutesToday → 0`, `injuriesHealedToday → 0`, `lastRestReset → now`. For characters additionally: `drainedAp → 0`
4. **[Mechanic: new-day-scope]** Important: new day does NOT reset `currentHp`, `injuries`, `statusConditions`, `lastInjuryTime`, or move usage counters. It only resets the daily *limit* counters
5. **[Bookkeeping]** API returns count of Pokemon and characters reset
6. **[Done]** All entities can now rest-heal a fresh 8 hours, heal up to 3 injuries, and trainers have drained AP restored

#### PTU Rules Applied

- Daily rest cap: "For the first 8 hours of rest each day" — the counter that tracks this resets (core/07-combat.md, Resting)
- Daily injury cap: "a maximum of 3 Injuries per day" — the counter resets (core/07-combat.md, Pokemon Centers)
- Drained AP: "Drained AP becomes unavailable for use until after an Extended Rest is taken" — note the app resets this on new day as a convenience, though PTU rules technically tie it to Extended Rest (core/06-playing-the-game.md, Action Points)

#### Expected End State

- All Pokemon: `restMinutesToday = 0`, `injuriesHealedToday = 0`, `lastRestReset = <now>`
- All characters: same plus `drainedAp = 0`
- API response: `{ pokemonReset: <count>, charactersReset: <count>, timestamp }`
- Entity sheets now show full rest allowance and zero injuries-healed-today

#### Variations

- **Individual new day**: GM resets only a single entity (uses per-entity new day endpoint instead of global). Useful when time flows differently for different characters → healing-workflow-individual-new-day
- **Auto-reset on rest**: The 30-min rest endpoint auto-checks `lastRestReset` against the current calendar day and resets counters if on a different day. This means individual daily counters may reset "automatically" when a rest is attempted on a new calendar day — but the global new day endpoint is the explicit, GM-controlled version

---

### W6: Mid-Combat Take a Breather

---
loop_id: healing-workflow-mid-combat-breather
tier: workflow
domain: healing
gm_intent: A combatant uses Take a Breather to cure volatile status conditions and reset combat stages during combat
ptu_refs:
  - core/07-combat.md#Take-a-Breather
app_features:
  - server/api/encounters/[id]/breather.post.ts
  - constants/statusConditions.ts
mechanics_exercised:
  - breather-stage-reset
  - breather-volatile-cure
  - breather-temp-hp-removal
  - breather-tripped-vulnerable
  - breather-action-cost
tactical_decisions:
  - breather-vs-attack
---

#### GM Context

A combatant in an active encounter is suffering from volatile status conditions (Confused, Enraged, etc.) and/or heavy combat stage debuffs. Taking a Breather sacrifices their entire turn (Full Action) to reset stages, remove temp HP, cure volatile conditions, and cure Slowed/Stuck — but leaves them Tripped and Vulnerable until their next turn.

#### Preconditions

- An encounter is active with combat in progress
- A combatant exists with volatile conditions, negative stages, or Slowed/Stuck
- It is the combatant's turn (or they can act)

#### Workflow Steps

1. **[Setup]** GM is on the encounter page (`/gm`), combat is active
2. **[Decision: breather-vs-attack]** GM/player weighs: is curing the conditions worth losing a full turn and becoming Tripped + Vulnerable? Relevant when Confused (might hurt self), Enraged (forced to attack nearest), or when stage debuffs are crippling
3. **[Action]** GM triggers Take a Breather for the combatant (calls `POST /api/encounters/:id/breather` with `{ combatantId }`)
4. **[Mechanic: breather-stage-reset]** Server resets ALL 7 combat stages (attack, defense, specialAttack, specialDefense, speed, accuracy, evasion) to 0
5. **[Mechanic: breather-temp-hp-removal]** Server sets `temporaryHp` to 0
6. **[Mechanic: breather-volatile-cure]** Server removes all volatile conditions (Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed) plus Slowed and Stuck from `statusConditions`
7. **[Mechanic: breather-tripped-vulnerable]** Server adds Tripped and Vulnerable as `tempConditions` (temporary, until next turn)
8. **[Mechanic: breather-action-cost]** Server marks `standardActionUsed = true` and `hasActed = true` on the combatant's turn state
9. **[Bookkeeping]** Server syncs changes to the underlying entity database record (if the combatant has an `entityId`). Appends a detailed entry to the encounter's `moveLog`
10. **[Done]** Combatant's turn is consumed. They are now Tripped and Vulnerable but free of volatile conditions and stage debuffs. Combat proceeds to next combatant

#### PTU Rules Applied

- Breather effects: "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions." (core/07-combat.md, Take a Breather)
- Breather cost: Full Action + must Shift away from enemies. "They become Tripped and Vulnerable until the end of their next turn." (core/07-combat.md, Take a Breather)

#### Expected End State

- Combatant's 7 stage modifiers all at 0
- `temporaryHp` is 0
- Volatile conditions + Slowed + Stuck removed from `statusConditions`
- Tripped + Vulnerable added as `tempConditions`
- `standardActionUsed` and `hasActed` are true
- Encounter `moveLog` contains breather action record with `stagesReset`, `conditionsCured`, `tempHpRemoved`
- Underlying entity DB record synced with updated stages and conditions

#### Variations

- **No volatile conditions**: Combatant uses breather purely to reset unfavorable combat stages. All volatile/condition curing is a no-op but stages still reset
- **Cursed condition (special case)**: PTU rules require the source of the Curse to be KO'd or beyond 12m for Cursed to be cured via breather. The app cures Cursed unconditionally — [GAP: FEATURE_GAP] no distance/KO check for Cursed source
- **Assisted Take a Breather**: PTU rules allow a trainer to help a Confused/Enraged Pokemon take a breather via Command Check DC 12. The app's breather endpoint does not implement this variant — [GAP: FEATURE_GAP] no assisted breather with Command Check

---

## Tier 2: Mechanic Validations

---

### M1: Rest HP Calculation Formula

---
loop_id: healing-mechanic-rest-hp-calculation
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Resting
app_features:
  - utils/restHealing.ts#calculateRestHealing
sub_loops:
  - healing-mechanic-rest-hp-minimum
  - healing-mechanic-rest-hp-cap
---

#### Preconditions

- Entity has `currentHp < maxHp`
- Entity has `injuries < 5`
- Entity has `restMinutesToday < 480`

#### Steps

1. Entity rests for 30 minutes
2. System calculates: `healAmount = max(1, floor(maxHp / 16))`
3. System caps: `actualHeal = min(healAmount, maxHp - currentHp)`
4. System updates: `currentHp += actualHeal`, `restMinutesToday += 30`

#### PTU Rules Applied

- "heal 1/16th of their Maximum Hit Points" per 30 minutes (core/07-combat.md, Resting)

#### Expected Outcomes

| maxHp | currentHp | Expected Heal | New HP |
|-------|-----------|---------------|--------|
| 160 | 100 | 10 (160/16) | 110 |
| 50 | 30 | 3 (floor(50/16)) | 33 |
| 10 | 5 | 1 (min 1, floor(10/16)=0) | 6 |
| 80 | 78 | 2 (capped: 80-78=2, healAmt=5) | 80 |
| 1 | 0 | 1 (min 1) | 1 |

#### Edge Cases

- **Very low maxHp (< 16)**: `floor(maxHp / 16)` rounds to 0 → minimum of 1 HP healed per rest
- **Near full HP**: Heal amount capped at `maxHp - currentHp`, not the full 1/16th
- **At full HP**: `canHeal = false`, reason "Already at full HP" — no API call needed

---

### M2: 5+ Injury Rest Block

---
loop_id: healing-mechanic-injury-rest-block
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Resting
app_features:
  - utils/restHealing.ts#calculateRestHealing
---

#### Preconditions

- Entity has varying injury counts

#### Steps

1. Entity attempts to rest with different injury counts
2. System checks: `if (injuries >= 5) → canHeal = false`

#### PTU Rules Applied

- "a Trainer or Pokemon is unable to restore Hit Points through rest if the individual has 5 or more injuries. Once the individual has 4 or fewer injuries, he or she may once again restore Hit Points by resting." (core/07-combat.md, Resting)

#### Expected Outcomes

| Injuries | canHeal | Reason |
|----------|---------|--------|
| 0 | true | (normal healing) |
| 4 | true | (normal healing) |
| 5 | false | "Cannot rest-heal with 5+ injuries" |
| 7 | false | "Cannot rest-heal with 5+ injuries" |

#### Edge Cases

- **Exactly 5 injuries**: The threshold is `>= 5`, so 5 injuries blocks healing
- **Heal from 5 to 4 injuries**: After Pokemon Center heals 1 injury (from 5 to 4), entity can rest-heal again
- **Extended rest with 5+ injuries**: HP healing portion blocked, but status clearing and AP restoration still proceed

---

### M3: Daily Rest Cap (480 Minutes)

---
loop_id: healing-mechanic-daily-rest-cap
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Resting
app_features:
  - utils/restHealing.ts#calculateRestHealing
  - server/api/pokemon/[id]/rest.post.ts
  - server/api/characters/[id]/rest.post.ts
---

#### Preconditions

- Entity has varying `restMinutesToday` values

#### Steps

1. Entity attempts rest at different cumulative rest times
2. System checks: `if (restMinutesToday >= 480) → canHeal = false`

#### PTU Rules Applied

- "For the first 8 hours of rest each day" — implies maximum of 480 minutes (core/07-combat.md, Resting)

#### Expected Outcomes

| restMinutesToday | canHeal | After Rest |
|-----------------|---------|------------|
| 0 | true | 30 |
| 450 | true | 480 |
| 480 | false | 480 (no change) |
| 510 | false | 510 (no change) |

#### Edge Cases

- **Extended rest + subsequent rest**: Extended rest adds up to 240 min (8 periods). If `restMinutesToday` was already 300, extended rest only adds ~6 periods (180 min) before hitting 480
- **Auto-reset on new calendar day**: Rest endpoint checks `lastRestReset` and resets counter if the date has changed, before applying rest

---

### M4: Extended Rest Status Clearing

---
loop_id: healing-mechanic-extended-rest-status-clearing
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Extended-Rest
app_features:
  - utils/restHealing.ts#getStatusesToClear
  - utils/restHealing.ts#clearPersistentStatusConditions
  - constants/statusConditions.ts
  - server/api/characters/[id]/extended-rest.post.ts
  - server/api/pokemon/[id]/extended-rest.post.ts
---

#### Preconditions

- Entity has one or more status conditions

#### Steps

1. Entity undergoes extended rest
2. System filters `statusConditions` to identify persistent conditions
3. System removes persistent conditions, keeps all others

#### PTU Rules Applied

- "Extended rests completely remove Persistent Status Conditions" (core/07-combat.md, Resting)
- Persistent conditions: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned (constants/statusConditions.ts)

#### Expected Outcomes

| Input Conditions | Cleared | Remaining |
|-----------------|---------|-----------|
| [Burned, Confused] | [Burned] | [Confused] |
| [Frozen, Paralyzed, Poisoned] | [Frozen, Paralyzed, Poisoned] | [] |
| [Asleep, Flinched, Stuck] | [] | [Asleep, Flinched, Stuck] |
| [Badly Poisoned, Enraged, Slowed] | [Badly Poisoned] | [Enraged, Slowed] |
| [] | [] | [] |

#### Edge Cases

- **Volatile conditions survive**: Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed are NOT cleared by extended rest
- **Other conditions survive**: Fainted, Stuck, Slowed, Trapped, Tripped, Vulnerable are NOT cleared
- **No conditions**: No-op — empty array remains empty

---

### M5: Extended Rest Move Recovery (Pokemon)

---
loop_id: healing-mechanic-extended-rest-move-recovery
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Extended-Rest
app_features:
  - server/api/pokemon/[id]/extended-rest.post.ts
---

#### Preconditions

- Pokemon has moves with `usedToday > 0` or daily-frequency moves with `usedThisScene > 0`

#### Steps

1. Pokemon undergoes extended rest
2. Server parses `moves` JSON and iterates over each move
3. For each move: sets `usedToday = 0`
4. For daily-frequency moves (frequency starts with "Daily"): also sets `usedThisScene = 0`

#### PTU Rules Applied

- "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day." (core/07-combat.md, Resting)

#### Expected Outcomes

| Move | Frequency | usedToday Before | usedThisScene Before | usedToday After | usedThisScene After |
|------|-----------|-----------------|---------------------|----------------|-------------------|
| Tackle | At-Will | 3 | 1 | 0 | 1 (unchanged) |
| Flamethrower | EOT | 1 | 1 | 0 | 1 (unchanged) |
| Hyper Beam | Daily x2 | 2 | 1 | 0 | 0 |
| Draco Meteor | Daily x1 | 1 | 1 | 0 | 0 |

#### Edge Cases

- **At-Will moves**: `usedToday` reset but `usedThisScene` unchanged (scene tracking unaffected)
- **EOT moves**: Same as At-Will — `usedToday` reset, `usedThisScene` unchanged
- **Daily moves**: Both `usedToday` and `usedThisScene` reset to 0
- **Character extended rest**: Does NOT touch moves (characters don't have move frequency tracking in this context)

---

### M6: Pokemon Center Time Calculation

---
loop_id: healing-mechanic-pokemon-center-time
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Pokemon-Centers
app_features:
  - utils/restHealing.ts#calculatePokemonCenterTime
---

#### Preconditions

- Entity has a known injury count

#### Steps

1. Calculate base time: 60 minutes
2. If injuries < 5: `injuryTime = injuries * 30` minutes
3. If injuries >= 5: `injuryTime = injuries * 60` minutes
4. `totalTime = 60 + injuryTime`

#### PTU Rules Applied

- "In a mere hour" — base time (core/07-combat.md, Pokemon Centers)
- "For each Injury on the Trainer or Pokemon, Healing takes an additional 30 minutes. If the Trainer or Pokemon has five or more Injuries, it takes one additional hour per Injury instead." (core/07-combat.md, Pokemon Centers)

#### Expected Outcomes

| Injuries | Base | Injury Time | Total | Description |
|----------|------|-------------|-------|-------------|
| 0 | 60 | 0 | 60 | "1 hour" |
| 1 | 60 | 30 | 90 | "1 hour 30 min" |
| 3 | 60 | 90 | 150 | "2 hours 30 min" |
| 4 | 60 | 120 | 180 | "3 hours" |
| 5 | 60 | 300 | 360 | "6 hours" |
| 7 | 60 | 420 | 480 | "8 hours" |

#### Edge Cases

- **Exactly 5 injuries**: Switches from 30-min to 60-min per injury. Jump from 4→5 injuries is 180 min → 360 min (doubling, not linear)
- **Very high injuries (e.g., 9)**: 60 + (9*60) = 600 min = 10 hours — a significant narrative time cost

---

### M7: Daily Injury Healing Cap

---
loop_id: healing-mechanic-daily-injury-cap
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Pokemon-Centers
  - core/09-gear-and-items.md#Bandages
app_features:
  - utils/restHealing.ts#calculatePokemonCenterInjuryHealing
  - server/api/characters/[id]/heal-injury.post.ts
  - server/api/pokemon/[id]/heal-injury.post.ts
  - server/api/characters/[id]/pokemon-center.post.ts
  - server/api/pokemon/[id]/pokemon-center.post.ts
---

#### Preconditions

- Entity has injuries > 0
- Entity has varying `injuriesHealedToday` values

#### Steps

1. System calculates healable injuries: `maxHealable = max(0, 3 - injuriesHealedToday)`
2. Injuries healed = `min(injuries, maxHealable)`

#### PTU Rules Applied

- "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total." (core/07-combat.md, Pokemon Centers)

#### Expected Outcomes

| injuries | injuriesHealedToday | maxHealable | injuriesHealed |
|----------|-------------------|-------------|----------------|
| 5 | 0 | 3 | 3 |
| 2 | 0 | 3 | 2 |
| 4 | 2 | 1 | 1 |
| 3 | 3 | 0 | 0 |
| 1 | 3 | 0 | 0 |

#### Edge Cases

- **Shared cap across sources**: Natural healing, AP drain, and Pokemon Center ALL increment `injuriesHealedToday`. A natural heal at 10am + Pokemon Center at 2pm = 2 of 3 daily slots used
- **Multiple Pokemon Center visits**: First visit heals 3 injuries. Second visit same day heals 0 injuries (cap reached)
- **New day resets cap**: `injuriesHealedToday` resets to 0 on new day, allowing another 3 heals

---

### M8: Natural Injury Healing Timer

---
loop_id: healing-mechanic-natural-injury-timer
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Injuries
app_features:
  - utils/restHealing.ts#canHealInjuryNaturally
  - server/api/characters/[id]/heal-injury.post.ts
  - server/api/pokemon/[id]/heal-injury.post.ts
---

#### Preconditions

- Entity has injuries > 0
- Entity has a `lastInjuryTime` value

#### Steps

1. System calculates hours since last injury: `(now - lastInjuryTime) / (1000 * 60 * 60)`
2. If >= 24 hours: natural healing available
3. After healing: if injuries remain, `lastInjuryTime` resets to now (restarts 24h timer). If 0 injuries, `lastInjuryTime` set to null

#### PTU Rules Applied

- "they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries." (core/07-combat.md, Injuries)

#### Expected Outcomes

| lastInjuryTime | Hours Elapsed | canHealNaturally |
|---------------|---------------|------------------|
| 25 hours ago | 25 | true |
| 24 hours ago | 24 | true |
| 23.9 hours ago | 23.9 | false |
| 12 hours ago | 12 | false |
| null | N/A | false |

#### Edge Cases

- **null lastInjuryTime**: Returns false — no injury time recorded, so the 24h clock cannot be checked. This occurs after all injuries are fully healed (lastInjuryTime cleared to null)
- **Timer resets after natural heal**: If entity has 3 injuries and heals 1 naturally, `lastInjuryTime` resets to now. They must wait another 24 hours for the next natural heal
- **Timer does NOT reset on AP drain**: AP drain injury healing does not modify `lastInjuryTime` (only natural healing resets it)
- **New injury resets timer**: Gaining a new injury sets `lastInjuryTime` to now, restarting the 24h clock (this happens in the damage/injury endpoints, not the healing endpoints)

---

### M9: AP Drain Injury Healing (Trainers Only)

---
loop_id: healing-mechanic-ap-drain-injury
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Injuries
app_features:
  - server/api/characters/[id]/heal-injury.post.ts
---

#### Preconditions

- Entity is a HumanCharacter (not Pokemon)
- Entity has injuries > 0
- Entity has `injuriesHealedToday < 3`

#### Steps

1. Character drains 2 AP to heal 1 injury
2. System updates: `injuries -= 1`, `drainedAp += 2`, `injuriesHealedToday += 1`
3. If injuries reach 0: `lastInjuryTime = null`

#### PTU Rules Applied

- "Trainers can also remove Injuries as an Extended Action by Draining 2 AP." (core/07-combat.md, Injuries)
- "This is subject to the limitations on healing Injuries each day." (core/07-combat.md, Injuries)

#### Expected Outcomes

| injuries | drainedAp Before | injuriesHealedToday | Result |
|----------|-----------------|-------------------|--------|
| 3 | 0 | 0 | injuries=2, drainedAp=2, healed=1 |
| 1 | 2 | 1 | injuries=0, drainedAp=4, healed=2, lastInjuryTime=null |
| 2 | 0 | 3 | BLOCKED (daily cap) |

#### Edge Cases

- **Pokemon cannot drain AP**: The Pokemon heal-injury endpoint only supports `method: 'natural'`, not `'drain_ap'`. The "Drain 2 AP" button is hidden in the UI for Pokemon entities
- **No time requirement**: Unlike natural healing, AP drain has no 24h timer — it's available immediately (subject to daily cap)
- **AP accumulation**: Draining AP multiple times accumulates. Healing 3 injuries by AP drain = 6 drained AP. Only Extended Rest or new day restores drained AP
- **Drained AP restored on extended rest**: `drainedAp` is reset to 0 during extended rest (character endpoint only)

---

### M10: Take a Breather Combat Effects

---
loop_id: healing-mechanic-breather-effects
tier: mechanic
domain: healing
ptu_refs:
  - core/07-combat.md#Take-a-Breather
app_features:
  - server/api/encounters/[id]/breather.post.ts
  - constants/statusConditions.ts
sub_loops:
  - healing-mechanic-breather-volatile-cure
---

#### Preconditions

- Active encounter with combat in progress
- Combatant exists with some combination of: combat stage modifications, temporary HP, volatile conditions, Slowed, Stuck

#### Steps

1. Combatant takes a breather
2. All 7 combat stages (attack, defense, specialAttack, specialDefense, speed, accuracy, evasion) set to 0
3. `temporaryHp` set to 0
4. Volatile conditions removed: Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed
5. Also removed: Slowed, Stuck
6. Added as temp conditions: Tripped, Vulnerable (until end of next turn)
7. Turn state: `standardActionUsed = true`, `hasActed = true`
8. Changes synced to underlying entity DB record

#### PTU Rules Applied

- "they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions" (core/07-combat.md, Take a Breather)

#### Expected Outcomes

| Before Stages | After Stages | Before Conditions | After Conditions | Temp Conditions |
|--------------|-------------|-------------------|------------------|-----------------|
| atk: +3, def: -2 | all 0 | [Confused, Burned] | [Burned] | [Tripped, Vulnerable] |
| all 0 | all 0 | [Enraged, Slowed] | [] | [Tripped, Vulnerable] |
| spd: -6, acc: -4 | all 0 | [Stuck, Paralyzed] | [Paralyzed] | [Tripped, Vulnerable] |

#### Edge Cases

- **Persistent conditions survive**: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned are NOT cured by breather (only volatile + Slowed + Stuck)
- **Positive stages lost**: If combatant had beneficial stages (+3 attack), those are also reset to 0. This is a tactical cost
- **Temp HP lost**: Any temporary HP buffer is removed, which may leave the combatant more vulnerable
- **Tripped + Vulnerable**: These are added as `tempConditions` (separate from `statusConditions`), meaning they auto-expire
- **DB sync**: Changes are persisted to the underlying Pokemon/HumanCharacter record via `syncEntityToDatabase`. Template-only combatants (no `entityId`) skip the DB sync

---

## Mechanic Coverage Verification

| Tier 2 Mechanic | Exercised By Workflow(s) |
|-----------------|------------------------|
| M1: rest-hp-calculation | W1 (step 4), W2 (step 4) |
| M2: injury-rest-block | W1 (variation: blocked by injuries), W2 (variation: 5+ injuries) |
| M3: daily-rest-cap | W1 (step 5), W2 (step 7) |
| M4: extended-rest-status-clearing | W2 (step 5) |
| M5: extended-rest-move-recovery | W2 (step 10) |
| M6: pokemon-center-time | W3 (step 7) |
| M7: daily-injury-cap | W3 (step 6), W4 (step 8) |
| M8: natural-injury-timer | W4 (steps 4-5) |
| M9: ap-drain-injury | W4 (steps 6-7) |
| M10: breather-effects | W6 (steps 4-8) |

All Tier 2 mechanics are exercised by at least one Tier 1 workflow. Tier 2 validations remain valuable for isolating formula math and edge cases.

---

## Feasibility Summary

| Loop ID | Step | Gap Type | Description |
|---------|------|----------|-------------|
| healing-workflow-mid-combat-breather | Cursed condition | FEATURE_GAP | App cures Cursed unconditionally; PTU requires source to be KO'd or >12m away |
| healing-workflow-mid-combat-breather | Assisted breather | FEATURE_GAP | No assisted Take a Breather via Command Check DC 12 (trainer helps Confused/Enraged Pokemon) |
| (cross-domain) | Bandages | FEATURE_GAP | No item/inventory system — Bandages (doubled healing rate, injury after 6h) not implemented |
| (cross-domain) | First Aid Kit / Expertise | FEATURE_GAP | No trainer feature system — First Aid Kit healing and First Aid Expertise injury removal not implemented |
| (cross-domain) | Nurse / Proper Care / Field Clinic | FEATURE_GAP | No Medic class feature system — doubled rest rate, camp healing, daily injury cap bypass not implemented |
| (cross-domain) | Breather shift-away | UX_GAP | Breather endpoint does not enforce "shift as far away from enemies as possible" movement requirement — VTT movement is handled separately |

**Notes on cross-domain gaps:** The item system (Bandages, First Aid Kit) and trainer class features (Nurse, Proper Care, Field Clinic, Combat Medic) are not part of the healing domain's current scope. They represent future feature work that would augment the existing healing system. The core rest/healing/injury mechanics are fully implemented.
