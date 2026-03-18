The file `app/constants/pokeBalls.ts` defines `POKE_BALL_CATALOG`, a `Record<string, PokeBallDef>` containing 25 Poke Ball types from PTU Chapter 9 (pp.271-273). Modifier sign convention: negative values make capture easier.

**Basic** (4): Basic Ball (-0), Great Ball (-5), Ultra Ball (-10), Master Ball (auto-capture).

**Safari** (3): Safari Ball (-0), Sport Ball (-0), Park Ball (-0).

**Apricorn** (7): Fast Ball, Friend Ball, Heavy Ball, Level Ball, Love Ball, Lure Ball, Moon Ball — each with conditional modifiers based on target attributes.

**Special** (11): Dive Ball, Dusk Ball, Heal Ball, Luxury Ball, Nest Ball, Net Ball, Quick Ball, Repeat Ball, Timer Ball, Premier Ball, Cherish Ball — each with conditional modifiers or post-capture effects.

Each ball has: `id`, `name`, `category`, base `modifier`, `description`, `cost`, and optional `conditionDescription` / `postCaptureEffect` / `postCaptureDescription`. Post-capture effects are typed as `heal_full`, `loyalty_plus_one`, or `raised_happiness`.

The `calculateBallModifier()` function evaluates conditional modifiers using a `BallConditionContext` object with ~18 fields describing the capture situation. The [[capture-ball-selector-dropdown]] organizes balls into three visible groups (Basic, Apricorn, Special). The [[legendary-species-constant-set]] affects capture rate calculations independently.
