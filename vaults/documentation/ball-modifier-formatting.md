# Ball Modifier Formatting

Two display utilities in `utils/pokeBallFormatters.ts` for [[poke-ball-system|ball modifier]] presentation.

`formatModifier(mod)` renders a signed string (e.g. "+0", "−10", "+5").

`modifierClass(mod)` returns a CSS class: negative modifiers (easier capture) map to `mod--positive` (green), positive modifiers (harder) to `mod--negative` (red), zero to `mod--neutral`. The inversion reflects that lower rolls are better in the PTU capture system.
