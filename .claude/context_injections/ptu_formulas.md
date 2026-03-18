## PTU Key Formulas

These are non-obvious and frequently needed. Get them wrong and the game breaks.

### HP
- **Pokemon:** `level + (baseHp * 3) + 10`
- **Trainer:** `(level * 2) + (baseHp * 3) + 10`

### Evasion
- Physical/Special/Speed evasion = `floor(calculatedStat / 5)`
- Uses **calculated stats** (base + level-up points + nature), NOT base stats alone
- Max evasion modifier: +6

### Combat Stages
- Range: -6 to +6
- Positive: `stat * (1 + stage * 0.2)` (+20% per stage)
- Negative: `stat * (1 + stage * 0.1)` (-10% per stage, note: stage is negative so this reduces)
- The asymmetry is intentional — buffs are stronger than debuffs

### Damage
- `Damage = Attack Roll + Attack Stat - Defense Stat`
- Attack Roll = dice from Damage Base table + modifiers
- Physical: ATK vs DEF. Special: SpATK vs SpDEF.
- STAB: +2 to Damage Base (not flat damage) when move type matches user type
- Critical hit: maximize damage dice, then roll again and add

### Capture Rate
- Base rate from species data, modified by: HP%, level, evolution stage, status conditions (sleep/freeze bonus), injuries, ball type, shiny/legendary penalties
- Full formula in `core/05-pokemon.md` (search "Capture Rate")

### Movement
- Diagonal movement alternates cost: 1m, 2m, 1m, 2m...
- Each grid cell = 1 meter
