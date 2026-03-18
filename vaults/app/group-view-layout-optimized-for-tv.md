# Group View Layout Optimized for TV

The [[group-view-page]] uses the `group` layout, which is a full-height flex column with a dark radial gradient background. A subtle fixed overlay adds faint violet and scarlet radial gradient accents.

At viewport widths above 3000px (targeting 4K TV displays), the layout scales up: the base font-size increases to 1.5rem, and individual components apply their own `@media (min-width: 3000px)` overrides to increase padding, element sizes, and font sizes. Examples include:
- [[group-view-lobby-player-card]] avatars grow from 64px to 96px, Pokemon sprites from 48px to 64px, type pips from 12px to 16px, HP bars from 60px to 80px.
- [[group-view-encounter-tab]] initiative sidebar grows from 280px to 400px, details panel from 320px to 450px.
- [[group-view-wild-spawn-overlay]] sprite containers grow from 128px to 192px.
- [[group-view-combatant-card]] sprites grow from 120px to 240px, turn arrows from 20px to 30px.
- [[group-view-initiative-tracker]] sprites grow from 32px to 48px, order badges from 24px to 32px.
