# P1 Specification

## D. XP Distribution UI -- Post-Encounter Modal (P1)

### New Component: `app/components/encounter/XpDistributionModal.vue`

**Trigger:** When the GM clicks "End Encounter" and the encounter has `defeatedEnemies.length > 0`, show this modal before (or after) the end endpoint fires.

**Flow:**
1. GM clicks "End Encounter" on `EncounterHeader`
2. If `defeatedEnemies` is non-empty, show `XpDistributionModal` instead of the current `confirm()` dialog
3. Modal displays:
   - **Defeated enemies list** with species, level, and type tag (Pokemon/Trainer)
   - **Significance multiplier** selector (preset dropdown + custom number input)
   - **Player count** (auto-detected from unique owners of player-side Pokemon, editable)
   - **Boss encounter** toggle
   - **Calculated XP per player** (live-updating as inputs change)
   - **Per-player distribution section:** For each player, show their Pokemon that participated. Each Pokemon has an XP input field. Running total shows remaining XP to allocate.
4. GM adjusts distribution and clicks "Apply XP"
5. Frontend calls `POST /api/encounters/:id/xp-distribute`
6. On success, display results summary (who leveled up, new levels, available moves)
7. Then proceed with the existing end-encounter flow

**Alternative flow:** GM can click "Skip XP" to end the encounter without distributing XP (for encounters where XP was already given manually, or where the GM wants to defer).

### UI Layout (Rough)

```
+--------------------------------------------------+
| Post-Combat XP Distribution                  [X] |
+--------------------------------------------------+
| Defeated Enemies:                                |
|   Pidgey Lv.5, Rattata Lv.3, Bug Catcher Lv.8  |
|                                                  |
| Significance: [Average (x2)  v] [Custom: ___]   |
| Players: [3]  Boss Encounter: [ ]                |
|                                                  |
| Base XP: 24  |  x2  |  / 3 players  =  16 each  |
+--------------------------------------------------+
| Player: Hassan                                   |
|   [Chompy Lv.12]     XP: [10]  (Exp: 135->145)  |
|   [Sparky Lv.8]      XP: [6]   (Exp: 70->76)    |
|   Remaining: 0 / 16                              |
|--------------------------------------------------|
| Player: Ilaria                                   |
|   [Iris Lv.10]       XP: [16]  (Exp: 90->106)   |
|   Remaining: 0 / 16              LEVEL UP! -> 11 |
+--------------------------------------------------+
| [Skip XP]                         [Apply XP]     |
+--------------------------------------------------+
```

### Integration Points

- **`app/pages/gm/index.vue`**: Change `endEncounter()` from `confirm()` to opening `XpDistributionModal` when `defeatedEnemies.length > 0`
- **`app/components/gm/EncounterHeader.vue`**: No change needed (already emits `@end`)
- **`app/stores/encounter.ts`**: Add `distributeXp()` action that calls the distribute endpoint
- **WebSocket**: After XP distribution, broadcast `xp_distributed` event so Group View can show level-up celebrations

---

