---
review_id: rules-review-317
ticket_ids: [bug-058, ptu-rule-150]
reviewer: game-logic-reviewer
status: approved-with-notes
date: 2026-03-06
branch: master
commits_reviewed:
  - f479c4c7  # feat: add HpReductionType to calculateDamage
  - e65c8385  # feat: damage endpoint accepts lossType
  - 2a40a84d  # feat: frontend composable accepts lossType
  - 064119a2  # fix: tick damage and weather damage use hpLoss type
  - ae63b934  # fix: weather ability damage uses hpLoss type
  - 5758c16a  # feat: propagate lossType through store and handlers
  - 0f326187  # feat: add HP reduction type selector to GM damage controls
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/utils/turn-helpers.ts
  - app/composables/useEncounterCombatActions.ts
  - app/composables/useEncounterActions.ts
  - app/stores/encounter.ts
  - app/components/encounter/CombatantGmActions.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/gm/CombatantSides.vue
rulebook_sections_checked:
  - "07-combat.md p.236 (lines 794-798): Hit Point Loss rule"
  - "07-combat.md p.250 (lines 1841-1856): Gaining Injuries / Massive Damage"
  - "07-combat.md p.250 (lines 1898-1905): Heavily Injured"
  - "07-combat.md p.247-248 (lines 1645-1668): Temporary Hit Points"
  - "07-combat.md p.246-247 (lines 1537-1600): Burn, Poison, Badly Poisoned, Cursed tick descriptions"
  - "10-indices-and-reference.md p.342 (lines 3550-3616): Weather Conditions"
  - "10-indices-and-reference.md p.391 (lines 7552-7561): Belly Drum move"
  - "10-indices-and-reference.md p.400 (lines 8609-8623): Pain Split move"
  - "10-indices-and-reference.md p.395 (lines 7929-7939): Endeavor move"
  - "10-indices-and-reference.md (lines 2393-2397): Solar Power ability"
  - "10-indices-and-reference.md (lines 1169-1177): Dry Skin ability"
  - "09-gear-and-items.md (lines 1929-1932): Life Orb item"
  - "errata-2.md: no errata found on massive damage, HP loss, or heavily injured"
decrees_checked:
  - decree-001 (minimum 1 damage at both steps -- not directly affected)
  - decree-004 (massive damage uses real HP after temp HP -- correctly preserved for lossType='damage')
  - decree-032 (Cursed tick on Standard Action only -- not affected)
severity_summary:
  CRITICAL: 0
  HIGH: 0
  MEDIUM: 1
  LOW: 1
  INFO: 1
verdict: APPROVED WITH NOTES
---

# Rules Review 317: HP Loss Pathway (bug-058 + ptu-rule-150)

## Summary

This change introduces an `HpReductionType` enum (`'damage' | 'hpLoss' | 'setHp'`) to distinguish three categories of HP reduction per PTU 1.05 p.236 and p.250. The implementation correctly addresses the core problem: HP loss effects (Belly Drum, Life Orb) and HP-setting effects (Pain Split, Endeavor) were incorrectly triggering massive damage injury checks.

## Verification Results

### 1. HpReductionType correctly gates massive damage check -- PASS

**Rule (PTU p.236, lines 794-798):**
> "Effects that say 'loses Hit Points' or that set Hit Points to a certain value instead of 'deals damage' do not have Defensive Stats applied to these Hit Point changes nor cause Injuries from Massive Damage."

**Rule (PTU p.250, lines 1846-1848):**
> "Massive Damage Injuries are never gained from Moves that cause you to 'Set' or 'lose' Hit Points, such as a Pain Split or Endeavor."

**Implementation** (`combatant.service.ts` line 137):
```typescript
const massiveDamageInjury = lossType === 'damage' && hpDamage >= maxHp / 2
```

Correctly gates the massive damage injury to only trigger for `lossType === 'damage'`. Both `hpLoss` and `setHp` skip the massive damage check. This matches RAW exactly.

Per decree-004, the massive damage threshold uses `hpDamage` (real HP lost after temp HP absorption), not total incoming damage. This behavior is preserved for standard damage.

### 2. HP marker injuries still trigger for all reduction types -- PASS

**Rule (PTU p.250, lines 1849-1852):**
> "The Hit Point Markers are 50%, 0%, -50%, -100%, and every -50% lower thereafter. Whenever a Pokemon or Trainer reaches one of these Hit Point values, they take 1 Injury."

**Implementation** (`combatant.service.ts` lines 139-145):
The `countMarkersCrossed()` call is outside any `lossType` guard -- it runs for all HP reduction types. This is correct: the rulebook only exempts massive damage for HP loss/set-HP effects, not marker injuries.

Note: Pain Split's move text (p.400) says "Do not add Injuries from Pain Split from Hit Point Markers until the full effect of the Move has been resolved." This deferral mechanic is NOT implemented -- marker injuries fire immediately during `calculateDamage`. This is a **pre-existing limitation** not introduced by these commits; Pain Split would need special handling beyond the `setHp` type. See INFO-001 below.

### 3. Heavily injured penalty correctly skipped for non-damage types -- PASS

**Rule (PTU p.250, lines 1900-1903):**
> "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have."

Key phrase: "takes Damage from an attack." HP loss effects (Belly Drum, Life Orb, tick damage) and set-HP effects (Pain Split, Endeavor) are not "damage from an attack."

**Implementation** (`damage.post.ts` line 59, 96):
```typescript
const isDamageFromAttack = lossType === 'damage'
// ...
if (isDamageFromAttack && heavilyInjuredCheck.isHeavilyInjured && entity.currentHp > 0) {
```

Correctly gates the heavily injured "takes damage from an attack" penalty to only `lossType === 'damage'`. The standard-action trigger for heavily injured is handled separately in `next-turn.post.ts` and action endpoints (ptu-rule-151), and is unaffected by this change.

### 4. Tick/weather damage correctly uses hpLoss type -- PASS

**Rule (PTU p.246, lines 1542, 1565, 1600):**
- Burn: "they **lose** a Tick of Hit Points"
- Poison: "they **lose** a Tick of Hit Points"
- Cursed: "they **lose** two ticks of Hit Points"

**Rule (PTU p.342, lines 3552, 3586):**
- Hail: "all non-Ice Type Pokemon **lose** a Tick of Hit Points"
- Sandstorm: "all non-Ground, Rock, or Steel Type Pokemon **lose** a Tick of Hit Points"

**Rule (PTU pp.311-335, lines 2395, 1172-1173):**
- Solar Power: "the Pokemon **loses** 1/16th of its Max HP"
- Dry Skin: "they **lose** a Tick of Hit Points"

All of these use "lose/loses" Hit Points language, explicitly qualifying them as HP loss, not damage.

**Implementation:**
- `next-turn.post.ts` lines 277-283: tick damage passes `'hpLoss'` -- correct
- `next-turn.post.ts` lines 554-561: weather damage passes `'hpLoss'` -- correct
- `turn-helpers.ts` lines 342-348: weather ability damage passes `'hpLoss'` -- correct

### 5. GM UI selector -- PASS with LOW note

**Implementation** (`CombatantGmActions.vue`):
Three-option dropdown (`DMG` / `Loss` / `Set`) adjacent to the damage button. Default is `damage`. The `title` attribute provides context. The dropdown persists its selection after damage application (only `damageInput` resets to 0).

### 6. Frontend propagation through store/composables -- PASS

Full chain verified:
- `CombatantGmActions.vue` emits `(id, damage, lossType)`
- `CombatantCard.vue` forwards via `@damage="(id, dmg, lt) => $emit('damage', id, dmg, lt)"`
- `CombatantSides.vue` forwards similarly (all 4 `@damage` bindings updated)
- `pages/gm/index.vue` receives at `handleDamage`
- `useEncounterActions.ts` `handleDamage()` accepts optional `lossType` param, passes to store
- `encounter.ts` store `applyDamage()` forwards `lossType`
- `useEncounterCombatActions.ts` `applyDamage()` sends `lossType` in request body
- `damage.post.ts` receives, validates, and applies `lossType`

All emit type signatures updated consistently. Snapshot label correctly differentiates: "Applied 50 HP loss to Snorlax" vs "Applied 30 damage to Pikachu".

## Findings

### MEDIUM-001: Temp HP bypass for hpLoss type may contradict PTU blanket rule

**Files:** `app/server/services/combatant.service.ts` lines 117-121

**Rule (PTU p.247-248, lines 1653-1654):**
> "However, Temporary Hit Points are always lost first from damage **or any other effects**. Damage carries over directly to real Hit Points once the Temporary Hit Points are lost."

**Current behavior:** The implementation skips temp HP absorption for both `hpLoss` and `setHp`:
```typescript
if (lossType === 'damage' && temporaryHp > 0) {
```

**Analysis:**
- For `setHp` (Pain Split): **Correct.** Pain Split (p.400) explicitly says "Hit Point loss from Pain Split cannot be prevented in any way." Temp HP absorption would prevent some of the loss.
- For `hpLoss` (Belly Drum, Life Orb): **Ambiguous.** The PTU temp HP rule says "always lost first from damage or any other effects," which could include HP loss effects. However, Belly Drum's 50% self-cost and Life Orb's recoil are self-imposed costs where temp HP absorption could trivialize the drawback. The implementation's approach (skipping temp HP for all non-damage) is a defensible interpretation, but it contradicts the literal blanket statement on p.247.

**Recommendation:** File a `decree-need` ticket for GM ruling on whether temp HP should absorb `hpLoss`-type HP reductions.

**Severity: MEDIUM** -- The ambiguity could affect gameplay in edge cases where a Pokemon with temp HP uses Belly Drum or triggers Life Orb recoil.

### LOW-001: Dropdown does not reset to 'damage' after applying

**File:** `app/components/encounter/CombatantGmActions.vue` line 211

After applying damage, `damageInput` resets to 0 but `lossTypeInput` remains at its current selection. This means if the GM applies HP loss to one target, the next damage application (potentially to a different target) will also be HP loss unless the GM manually switches back.

This is a minor UX concern. The dropdown is visually persistent and positioned next to the damage button, so the GM should notice. However, `'damage'` is by far the most common case, and accidental misapplication could occur.

**Severity: LOW** -- Cosmetic/UX. No PTU rule violation. The GM can see and correct the selection.

### INFO-001: Pain Split marker injury deferral not implemented (pre-existing)

**Rule (PTU p.400, lines 8619-8621):**
> "Do not add Injuries from Pain Split from Hit Point Markers until the full effect of the Move has been resolved."

Pain Split has a unique mechanic where both the user and target lose HP, then both gain HP, and marker injuries are deferred until after the full HP manipulation resolves. The current `setHp` type applies marker injuries immediately during `calculateDamage`, which would produce incorrect results if Pain Split crossed and then un-crossed a marker threshold.

This is a **pre-existing issue** not introduced by these commits. The `setHp` type is a step in the right direction (correctly skipping massive damage), but full Pain Split support would require a two-phase calculation. No ticket filed for this as it requires a Pain Split-specific implementation beyond the scope of bug-058/ptu-rule-150.

**Severity: INFO** -- Pre-existing, not regression.

## Decrees Verified

- **decree-001** (minimum 1 damage floor): Not affected. The floor logic is in the damage calculation pipeline upstream of `calculateDamage`.
- **decree-004** (massive damage uses real HP after temp HP): Preserved for `lossType === 'damage'`. The `hpDamage` variable correctly reflects post-temp-HP real HP loss. For non-damage types, massive damage is skipped entirely, so decree-004's threshold logic is moot.
- **decree-032** (Cursed tick on Standard Action): Not affected. The Cursed tick condition logic in `status-automation.service.ts` determines *when* to apply the tick; this change only affects *how* the resulting HP loss is processed.

## Decree-Need Tickets

- **decree-need-053** (already filed by senior-reviewer via code-review-352): Whether temp HP should absorb `hpLoss`-type HP reductions. This rules review independently confirms the same ambiguity (MEDIUM-001). No duplicate ticket needed.

## Overall Assessment

The implementation correctly addresses the core PTU distinction between HP loss, set-HP, and damage. The three-type enum is well-designed, the rulebook citations are accurate, and the propagation through the full stack is complete. All tick damage, weather damage, and weather ability damage correctly use `hpLoss`. The massive damage gating and heavily injured penalty skipping are both PTU-correct.

One ambiguity identified (temp HP absorption for hpLoss type) warrants a decree. No CRITICAL or HIGH issues found.

**Verdict: APPROVED WITH NOTES** -- Ship as-is; address decree-need-053 ruling and LOW-001 UX refinement in follow-up.
