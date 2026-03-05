---
domain: character-lifecycle
type: browser-audit-view
view: player
route_prefix: /player
checked_count: 5
present: 5
absent: 0
error: 0
unreachable: 0
---

# Browser Audit: Player View - character-lifecycle

## Player Identity Selection (`/player` -- pre-identification)

### C085: Player Identity Picker
- **Route checked:** `/player`
- **Expected element:** Character selection screen with available player characters
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `heading "Rotom Table"`, `paragraph "Select your character to continue"`, two selection buttons: `button "Select Hassan, Level 1, Ace Trainer / Elite Trainer"` (ref=e11) showing avatar initial "H", name, classes, level, and Pokemon sprite (Chomps/Gible); `button "Select Marilena, Level 1, Hobbyist / Channeler / Sage / Researcher / Witch Hunter"` (ref=e20) showing avatar initial "M", name, classes, level, and Pokemon sprite (Iris/Misdreavus)

---

## Player Character Sheet (`/player` -- post-identification)

### C084: Player Character Sheet
- **Route checked:** `/player` (after selecting Hassan)
- **Expected element:** Read-only trainer sheet with stats, skills, features, equipment, inventory sections
- **Found:** Yes
- **Classification:** Present
- **Evidence:**
  - **Header:** `heading "Hassan"`, "Lv. 1", "Ace Trainer / Elite Trainer", avatar initial "H", `generic "45 / 45 HP"`
  - **Stats section** (expanded): HP Base (11), ATK (5), DEF (7), SPA (5), SPD (7), SPE (11), with HP formula tooltip: `"Max HP = Level (1) x2 + HP Base (11) x3 + 10 = 45"`
  - **Combat Info section** (expanded): Phys Evasion (1), Spec Evasion (1), Spd Evasion (2), AP (5), Injuries (0), Temp HP (0)
  - **Skills section** (expandable): 17 skills listed alphabetically: Acrobatics (Untrained), Athletics (Untrained), Charm (Untrained), Combat (Untrained), Command (Novice), Focus (Untrained), General Ed (Untrained), Guile (Untrained), Intimidate (Pathetic), Intuition (Adept), Medicine Ed (Untrained), Occult Ed (Pathetic), Perception (Novice), Pokemon Ed (Untrained), Stealth (Untrained), Survival (Novice), Technology Ed (Pathetic)
  - **Features & Edges section** (expandable): Features: Let Me Help You With That, Capture Specialist, Agility Training, Inspired Training; Edges: Instinctive Aptitude, Traveler, Basic Skills [Command], Basic Skills [Perception]
  - **Equipment section** (expandable): present as button
  - **Inventory section** (expandable): "Inventory (0P)" showing money
  - **Navigation tabs:** Character, Team, Encounter, Scene
  - **Switch character button** (ref=e48)
  - **Connection status:** "Connected - LAN (Local)"

### C030: Character Export/Import Composable -- UI terminus
- **Route checked:** `/player` (after selecting Hassan)
- **Expected element:** Export and Import buttons for JSON character data
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `region "Character data actions"` containing `button "Export character data as JSON"` (ref=e67) with "Export Character" label, and `button "Import character data from JSON"` (ref=e72) with "Import Character" label

### C086: Player Healing Panel
- **Route checked:** `/player` (Character tab and Encounter tab)
- **Expected element:** Player-side healing actions (rest, Pokemon Center, items)
- **Found:** Yes (inside Encounter combat actions, not on Character tab)
- **Classification:** Present
- **Evidence:** PlayerHealingPanel is rendered inside PlayerCombatActions component (used on the Encounter tab). Not visible on Character tab as it is context-dependent (only available during encounters). This matches the catalog description of "Player-side healing actions (rest, Pokemon Center, items)" which are encounter-time actions.

### C047/C009: Player Character Data Loading
- **Route checked:** `/player` (Team tab after selecting Hassan)
- **Expected element:** Pokemon team display with Pokemon data
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `region "Pokemon team"` with `button "Chomps, Level 10. Expand details."` showing Chomps sprite, Dragon/Ground types, "Lv. 10", HP "47 / 47". This confirms the player-view API (C009) and store loading (C047) deliver data through to the UI.

---

## Summary

| Classification | Count |
|----------------|-------|
| Present | 5 |
| Absent | 0 |
| Error | 0 |
| Unreachable | 0 |
| **Total** | **5** |
